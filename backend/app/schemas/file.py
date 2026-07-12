from app.schemas.base import CamelModel


class FileUploadResponse(CamelModel):
    url: str          # e.g. "/uploads/uuid4-filename.jpg"
    filename: str     # stored filename (uuid-prefixed)
    original_name: str
    size_bytes: int
    content_type: str
