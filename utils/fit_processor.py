import os
import math
import numpy as np
import pandas as pd
from fitparse import FitFile

class FitProcessor:
    def __init__(self, privacy_center_lat=23.048, privacy_center_lon=120.188, privacy_radius_km=1.0):
        self.privacy_center_lat = privacy_center_lat
        self.privacy_center_lon = privacy_center_lon
        self.privacy_radius_km = privacy_radius_km
        # Wahoo GPS semi-circles conversion factor
        self.semicircle_to_deg = 180.0 / (2**31)

    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance in km between two points using Haversine formula"""
        R = 6371.0  # Earth radius in km
        lat1_rad, lon1_rad = np.radians(lat1), np.radians(lon1)
        lat2_rad, lon2_rad = np.radians(lat2), np.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = np.sin(dlat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
        return R * c

    def parse_fit_file(self, file_path: str) -> pd.DataFrame:
        """Parse .fit file and return a raw DataFrame"""
        fitfile = FitFile(file_path)
        records = []
        for record in fitfile.get_messages("record"):
            data = {}
            for data_data in record:
                data[data_data.name] = data_data.value
            records.append(data)
            
        df = pd.DataFrame(records)
        
        # Convert semicircles to degrees if position data exists
        if 'position_lat' in df.columns and 'position_long' in df.columns:
            df['position_lat'] = df['position_lat'] * self.semicircle_to_deg
            df['position_long'] = df['position_long'] * self.semicircle_to_deg
            
        # Ensure standard columns exist to avoid KeyError
        expected_cols = ['timestamp', 'power', 'cadence', 'heart_rate', 'speed', 'distance']
        for col in expected_cols:
            if col not in df.columns:
                df[col] = np.nan
                
        # Sort by timestamp to ensure chronological order
        df = df.sort_values(by='timestamp').reset_index(drop=True)
        return df

    def apply_privacy_masking(self, df: pd.DataFrame) -> pd.DataFrame:
        """Mask GPS coordinates within the specified radius of the center point"""
        if 'position_lat' not in df.columns or 'position_long' not in df.columns:
            return df
            
        distances = self._haversine_distance(
            self.privacy_center_lat, self.privacy_center_lon, 
            df['position_lat'], df['position_long']
        )
        
        mask = distances <= self.privacy_radius_km
        df.loc[mask, 'position_lat'] = np.nan
        df.loc[mask, 'position_long'] = np.nan
        
        return df

    def label_behaviors(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Label each second with a behavior_state:
        - Stopped: speed < 0.8 m/s
        - Coasting: speed >= 0.8 m/s AND power == 0 (or null) AND cadence == 0 (or null)
        - Active: otherwise
        """
        speed = df['speed'].fillna(0)
        power = df['power'].fillna(0)
        cadence = df['cadence'].fillna(0)
        
        # Initialize all as Active
        df['behavior_state'] = 'Active'
        
        # Condition: Stopped
        stopped_mask = speed < 0.8
        
        # Condition: Coasting
        coasting_mask = (speed >= 0.8) & (power == 0) & (cadence == 0)
        
        df.loc[coasting_mask, 'behavior_state'] = 'Coasting'
        df.loc[stopped_mask, 'behavior_state'] = 'Stopped'
        
        return df

    def calculate_metrics(self, df: pd.DataFrame) -> dict:
        """Calculate advanced metrics from the processed DataFrame"""
        metrics = {}
        if len(df) == 0:
            return metrics
            
        # 計算總經過時間 (包含車錶 Auto-pause 未紀錄的時間)
        total_elapsed_time_s = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
        
        moving_seconds = len(df[df['speed'] >= 0.8])
        metrics['total_elapsed_time_s'] = int(total_elapsed_time_s)
        metrics['moving_time_s'] = moving_seconds
        metrics['stopped_time_s'] = int(total_elapsed_time_s - moving_seconds)
        
        # Total Distance in km
        if 'distance' in df.columns and not df['distance'].isna().all():
            metrics['total_distance_km'] = round((df['distance'].max() - df['distance'].min()) / 1000.0, 2)
        else:
            metrics['total_distance_km'] = 0.0
            
        # NP (Normalized Power)
        if 'power' in df.columns and not df['power'].isna().all():
            power_series = df['power'].fillna(0)
            rolling_30s = power_series.rolling(window=30, min_periods=1).mean()
            mean_4th = (rolling_30s ** 4).mean()
            metrics['normalized_power'] = round(mean_4th ** 0.25, 2)
        else:
            metrics['normalized_power'] = 0.0
            
        # Interference & Recovery
        is_stopped = (df['behavior_state'] == 'Stopped').astype(int)
        regular_stops = (is_stopped.diff() == 1).sum()
        
        # 加入 Auto-pause 的次數 (時間間隔大於 2 秒)
        time_diffs = df['timestamp'].diff().dt.total_seconds()
        auto_pauses = (time_diffs > 2).sum()
        
        metrics['stop_count'] = int(regular_stops + auto_pauses)
        
        coasting_seconds = len(df[df['behavior_state'] == 'Coasting'])
        metrics['coasting_time_ratio'] = round(coasting_seconds / len(df), 3)
        
        # Burst Power (First 10s after starting to move from a stop)
        burst_powers = []
        is_active = (df['behavior_state'] == 'Active').astype(int)
        active_transitions = df.index[(is_active.diff() == 1)].tolist()
        
        for idx in active_transitions:
            if idx + 10 < len(df):
                burst = df['power'].iloc[idx:idx+10].mean()
                if not np.isnan(burst):
                    burst_powers.append(burst)
                    
        metrics['avg_burst_power_10s'] = round(float(np.mean(burst_powers)), 2) if burst_powers else 0.0
        
        return metrics

    def process_file(self, file_path: str) -> dict:
        """Main orchestrator function"""
        df = self.parse_fit_file(file_path)
        df = self.apply_privacy_masking(df)
        df = self.label_behaviors(df)
        metrics = self.calculate_metrics(df)
        
        # Extract subset of columns for plotting, and convert NaNs to None for JSON
        plot_cols = ['timestamp', 'power', 'heart_rate', 'cadence', 'speed', 'behavior_state', 'position_lat', 'position_long']
        available_cols = [c for c in plot_cols if c in df.columns]
        plot_df = df[available_cols].copy()
        
        if 'timestamp' in plot_df.columns:
            plot_df['timestamp'] = plot_df['timestamp'].astype(str)
            
        plot_data = plot_df.replace({np.nan: None}).to_dict(orient='list')
        
        return {
            "metrics": metrics,
            "plot_data": plot_data
        }
