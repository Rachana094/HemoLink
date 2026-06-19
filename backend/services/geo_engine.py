"""
HemoLink Geo-Spatial Engine — Routing and optimization.
Implements Dijkstra, A* Search, ETA prediction, and traffic optimization.
"""
import math
import heapq
from typing import List, Dict, Any, Tuple, Optional
import numpy as np


class GeoSpatialEngine:
    """
    Geo-spatial intelligence for blood supply chain routing.
    Implements Dijkstra and A* on a virtual city road graph.
    """

    def __init__(self):
        self.avg_speed_kmh = 30.0
        self.city_graph = self._build_city_graph()

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    def _build_city_graph(self) -> Dict[str, List[Tuple[str, float, Dict]]]:
        """Build a virtual city road network around Bangalore."""
        nodes = {
            "koramangala": (12.9352, 77.6245), "indiranagar": (12.9784, 77.6408),
            "whitefield": (12.9698, 77.7500), "electronic_city": (12.8399, 77.6770),
            "jayanagar": (12.9300, 77.5838), "malleshwaram": (12.9969, 77.5700),
            "hebbal": (13.0358, 77.5970), "btm_layout": (12.9166, 77.6101),
            "hsr_layout": (12.9116, 77.6389), "marathahalli": (12.9591, 77.7009),
            "mg_road": (12.9757, 77.6063), "central": (12.9716, 77.5946),
            "yelahanka": (13.1007, 77.5963), "bannerghatta": (12.8700, 77.5964),
            "kr_puram": (13.0098, 77.6960), "jp_nagar": (12.9063, 77.5857),
        }
        self.node_coords = nodes
        edges = [
            ("koramangala", "indiranagar", 1.2), ("koramangala", "btm_layout", 0.8),
            ("koramangala", "hsr_layout", 1.0), ("indiranagar", "mg_road", 0.7),
            ("indiranagar", "marathahalli", 1.5), ("whitefield", "marathahalli", 1.8),
            ("whitefield", "kr_puram", 1.4), ("electronic_city", "btm_layout", 2.0),
            ("electronic_city", "bannerghatta", 1.6), ("jayanagar", "btm_layout", 0.9),
            ("jayanagar", "jp_nagar", 0.6), ("jayanagar", "central", 1.0),
            ("malleshwaram", "central", 0.8), ("malleshwaram", "hebbal", 1.2),
            ("hebbal", "yelahanka", 1.5), ("hebbal", "kr_puram", 2.0),
            ("central", "mg_road", 0.5), ("central", "koramangala", 1.1),
            ("hsr_layout", "electronic_city", 1.8), ("marathahalli", "kr_puram", 1.3),
            ("mg_road", "malleshwaram", 1.0), ("jp_nagar", "bannerghatta", 1.2),
            ("btm_layout", "jp_nagar", 0.7),
        ]
        graph = {n: [] for n in nodes}
        for a, b, traffic in edges:
            dist = self.haversine_distance(*nodes[a], *nodes[b])
            graph[a].append((b, dist, {"traffic_factor": traffic, "road_type": "main"}))
            graph[b].append((a, dist, {"traffic_factor": traffic, "road_type": "main"}))
        return graph

    def _nearest_node(self, lat: float, lng: float) -> str:
        best, best_dist = "central", float("inf")
        for name, (nlat, nlng) in self.node_coords.items():
            d = self.haversine_distance(lat, lng, nlat, nlng)
            if d < best_dist:
                best, best_dist = name, d
        return best

    def dijkstra(self, start: str, end: str) -> Tuple[List[str], float]:
        dist = {n: float("inf") for n in self.city_graph}
        prev = {n: None for n in self.city_graph}
        dist[start] = 0
        pq = [(0, start)]
        while pq:
            d, u = heapq.heappop(pq)
            if u == end:
                break
            if d > dist[u]:
                continue
            for v, w, meta in self.city_graph.get(u, []):
                nd = d + w * meta.get("traffic_factor", 1.0)
                if nd < dist[v]:
                    dist[v] = nd
                    prev[v] = u
                    heapq.heappush(pq, (nd, v))
        path, node = [], end
        while node:
            path.append(node)
            node = prev[node]
        return list(reversed(path)), dist[end]

    def a_star(self, start: str, end: str) -> Tuple[List[str], float]:
        end_coords = self.node_coords.get(end, (12.97, 77.59))
        g = {start: 0}
        f = {start: self.haversine_distance(*self.node_coords[start], *end_coords)}
        prev = {start: None}
        openset = [(f[start], start)]
        closed = set()
        while openset:
            _, u = heapq.heappop(openset)
            if u == end:
                break
            if u in closed:
                continue
            closed.add(u)
            for v, w, meta in self.city_graph.get(u, []):
                if v in closed:
                    continue
                ng = g[u] + w * meta.get("traffic_factor", 1.0)
                if ng < g.get(v, float("inf")):
                    g[v] = ng
                    h = self.haversine_distance(*self.node_coords[v], *end_coords)
                    f[v] = ng + h
                    prev[v] = u
                    heapq.heappush(openset, (f[v], v))
        path, node = [], end
        while node:
            path.append(node)
            node = prev.get(node)
        return list(reversed(path)), g.get(end, float("inf"))

    def find_optimal_route(self, origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> Dict[str, Any]:
        start = self._nearest_node(origin_lat, origin_lng)
        end = self._nearest_node(dest_lat, dest_lng)
        
        if start == end:
            direct = self.haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
            return {
                "distance_km": round(direct, 2), "estimated_time_minutes": round(direct / self.avg_speed_kmh * 60, 1),
                "path": [
                    {"name": "Origin Node", "lat": origin_lat, "lng": origin_lng}, 
                    {"name": start.replace("_", " ").upper(), "lat": self.node_coords[start][0], "lng": self.node_coords[start][1]},
                    {"name": "Destination Node", "lat": dest_lat, "lng": dest_lng}
                ],
                "algorithm_used": "snapped_direct", "optimization_notes": ["Origin and destination snapped in same zone."],
            }
            
        d_path, d_dist = self.dijkstra(start, end)
        a_path, a_dist = self.a_star(start, end)
        
        if a_dist <= d_dist:
            best_path, best_dist, algo = a_path, a_dist, "A* Search"
        else:
            best_path, best_dist, algo = d_path, d_dist, "Dijkstra"
            
        # Add snaps at both ends
        snap_start = self.haversine_distance(origin_lat, origin_lng, self.node_coords[start][0], self.node_coords[start][1])
        snap_end = self.haversine_distance(self.node_coords[end][0], self.node_coords[end][1], dest_lat, dest_lng)
        
        total_dist = best_dist + snap_start + snap_end
        
        path_coords = [{"name": "Origin", "lat": origin_lat, "lng": origin_lng}]
        for n in best_path:
            path_coords.append({"name": n.replace("_", " ").upper(), "lat": self.node_coords[n][0], "lng": self.node_coords[n][1]})
        path_coords.append({"name": "Destination", "lat": dest_lat, "lng": dest_lng})
        
        eta = total_dist / self.avg_speed_kmh * 60
        notes = [
            f"Snapping Origin to {start.replace('_', ' ').upper()} ({round(snap_start, 2)} km)",
            f"Routing to {end.replace('_', ' ').upper()} via {algo} ({round(best_dist, 2)} km)",
            f"Snapping Destination from {end.replace('_', ' ').upper()} ({round(snap_end, 2)} km)"
        ]
        
        return {
            "distance_km": round(total_dist, 2), "estimated_time_minutes": round(eta, 1),
            "path": path_coords, "algorithm_used": algo, "optimization_notes": notes,
            "nodes_explored": len(best_path), "dijkstra_distance": round(d_dist, 2), "astar_distance": round(a_dist, 2),
        }

    def get_network_info(self) -> Dict[str, Any]:
        return {"total_nodes": len(self.node_coords), "total_edges": sum(len(v) for v in self.city_graph.values()) // 2,
                "city": "Bangalore", "algorithms": ["Dijkstra", "A*"],
                "nodes": [{"name": n, "lat": c[0], "lng": c[1]} for n, c in self.node_coords.items()]}


geo_engine = GeoSpatialEngine()
