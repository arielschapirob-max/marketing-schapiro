from typing import Literal

from pydantic import BaseModel, field_validator

NivelConfianza = Literal["alto", "medio", "bajo"]


class ItemExtraido(BaseModel):
    """Representa un ítem de cuenta clínica/liquidación antes de su aprobación manual.

    Cada campo puede venir acompañado de un nivel de confianza (alto/medio/bajo)
    asignado por el motor de extracción, almacenado en ``confianza``.
    """

    numero_cuenta: str | None = None
    afiliado: str | None = None
    rut: str | None = None
    prestador: str | None = None
    isapre: str | None = None
    fecha: str | None = None
    diagnostico: str | None = None
    codigo_prestacion: str | None = None
    descripcion: str | None = None
    cantidad: float | None = None
    valor_cobrado: float | None = None
    valor_bonificado: float | None = None
    copago: float | None = None
    monto_no_cubierto: float | None = None
    glosa: str | None = None
    deducible: float | None = None
    total: float | None = None
    confianza: dict[str, NivelConfianza] = {}

    @field_validator("rut")
    @classmethod
    def _normalizar_rut(cls, v):
        if not v:
            return v
        from app.extraction.normalization import normalizar_rut

        return normalizar_rut(v) or v

    @field_validator(
        "cantidad",
        "valor_cobrado",
        "valor_bonificado",
        "copago",
        "monto_no_cubierto",
        "deducible",
        "total",
        mode="before",
    )
    @classmethod
    def _validar_rango_montos(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, (int, float)) and abs(v) > 10_000_000_000:
            raise ValueError("Monto fuera de rango esperado para una cuenta clínica")
        return v
