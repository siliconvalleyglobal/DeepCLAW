"""
Pluggable vector memory backends for DeepCLAW.
Provides abstract interface + optional real-client implementations for:
- Qdrant
- Weaviate
- Postgres + pgvector
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import math


class VectorMemoryBackend(ABC):
    @abstractmethod
    def upsert(self, id: str, vector: List[float], metadata: Dict[str, Any]) -> None:
        raise NotImplementedError

    @abstractmethod
    def query(self, vector: List[float], top_k: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def delete(self, id: str) -> None:
        raise NotImplementedError


class InMemoryVectorBackend(VectorMemoryBackend):
    def __init__(self) -> None:
        self._store: Dict[str, Dict[str, Any]] = {}

    def upsert(self, id: str, vector: List[float], metadata: Dict[str, Any]) -> None:
        self._store[id] = {"vector": vector, "metadata": metadata}

    def query(self, vector: List[float], top_k: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        import math
        scored = []
        for id, entry in self._store.items():
            if filters:
                if not all(entry["metadata"].get(k) == v for k, v in filters.items()):
                    continue
            score = self._cosine(vector, entry["vector"])
            scored.append({"id": id, "score": score, "metadata": entry["metadata"]})
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def delete(self, id: str) -> None:
        self._store.pop(id, None)

    @staticmethod
    def _cosine(a: List[float], b: List[float]) -> float:
        if not a or not b:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)


class QdrantBackend(VectorMemoryBackend):
    def __init__(self, url: str = "http://localhost:6333", collection: str = "deepclaw", api_key: Optional[str] = None):
        self.url = url.rstrip("/")
        self.collection = collection
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from qdrant_client import QdrantClient  # type: ignore
                self._client = QdrantClient(url=self.url, api_key=self.api_key)
            except ImportError as exc:
                raise ImportError("qdrant-client is required for QdrantBackend") from exc
        return self._client

    def upsert(self, id: str, vector: List[float], metadata: Dict[str, Any]) -> None:
        client = self._get_client()
        client.upsert(self.collection, points=[{"id": id, "vector": vector, "payload": metadata}])

    def query(self, vector: List[float], top_k: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        client = self._get_client()
        from qdrant_client.models import Filter, FieldCondition, MatchValue  # type: ignore
        qdrant_filter = None
        if filters:
            qdrant_filter = Filter(must=[FieldCondition(key=k, match=MatchValue(value=v)) for k, v in filters.items()])
        results = client.search(self.collection, query_vector=vector, limit=top_k, query_filter=qdrant_filter)
        return [{"id": str(r.id), "score": r.score, "metadata": r.payload or {}} for r in results]

    def delete(self, id: str) -> None:
        client = self._get_client()
        client.delete(self.collection, points_selector=[id])


class WeaviateBackend(VectorMemoryBackend):
    def __init__(self, url: str = "http://localhost:8080", class_name: str = "DeepClawMemory", api_key: Optional[str] = None):
        self.url = url.rstrip("/")
        self.class_name = class_name
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import weaviate  # type: ignore
                auth = weaviate.auth.AuthApiKey(api_key=self.api_key) if self.api_key else None
                self._client = weaviate.Client(url=self.url, auth_client_secret=auth)
            except ImportError as exc:
                raise ImportError("weaviate-client is required for WeaviateBackend") from exc
        return self._client

    def upsert(self, id: str, vector: List[float], metadata: Dict[str, Any]) -> None:
        client = self._get_client()
        client.data_object.create(data_object={**metadata, "vector": vector}, class_name=self.class_name, uuid=id)

    def query(self, vector: List[float], top_k: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        client = self._get_client()
        query = client.query.get(self.class_name, ["id", "vector", "metadata"]).with_near_vector({"vector": vector}).with_limit(top_k)
        if filters:
            for k, v in filters.items():
                query = query.with_where({"path": [k], "operator": "Equal", "valueString": str(v)})
        results = query.do()
        items = results.get("data", {}).get("Get", {}).get(self.class_name, [])
        return [{"id": item.get("id"), "score": item.get("_additional", {}).get("distance", 0.0), "metadata": item.get("metadata", {})} for item in items]

    def delete(self, id: str) -> None:
        client = self._get_client()
        client.data_object.delete(uuid=id, class_name=self.class_name)


class PgVectorBackend(VectorMemoryBackend):
    def __init__(self, connection_string: str, table_name: str = "deepclaw_vectors", embed_dim: int = 1536):
        self.connection_string = connection_string
        self.table_name = table_name
        self.embed_dim = embed_dim

    def _get_connection(self):
        try:
            import psycopg  # type: ignore
            return psycopg.connect(self.connection_string)
        except ImportError as exc:
            raise ImportError("psycopg is required for PgVectorBackend") from exc

    def upsert(self, id: str, vector: List[float], metadata: Dict[str, Any]) -> None:
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"INSERT INTO {self.table_name} (id, embedding, metadata) VALUES (%s, %s, %s) "
                    "ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding, metadata = EXCLUDED.metadata",
                    (id, vector, metadata),
                )
            conn.commit()
        finally:
            conn.close()

    def query(self, vector: List[float], top_k: int = 5, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                where_clause = ""
                params = [vector, top_k]
                if filters:
                    clauses = [f"metadata->>'%s' = %%s" % k for k in filters]
                    where_clause = "WHERE " + " AND ".join(clauses)
                    params.extend(filters.values())
                cur.execute(
                    f"SELECT id, 1 - (embedding <=> %s::vector) AS score, metadata FROM {self.table_name} "
                    f"{where_clause} ORDER BY score DESC LIMIT %s",
                    tuple(params),
                )
                rows = cur.fetchall()
                return [{"id": row[0], "score": float(row[1]), "metadata": row[2] or {}} for row in rows]
        finally:
            conn.close()

    def delete(self, id: str) -> None:
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {self.table_name} WHERE id = %s", (id,))
            conn.commit()
        finally:
            conn.close()
