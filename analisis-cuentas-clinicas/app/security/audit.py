"""Registro de acceso y de cambios (trazabilidad obligatoria por caso)."""

from app.db.models import RegistroAcceso, RegistroCambio


def registrar_acceso(session, caso_id: int, usuario: str, accion: str, detalle: str | None = None):
    registro = RegistroAcceso(caso_id=caso_id, usuario=usuario, accion=accion, detalle=detalle)
    session.add(registro)
    session.commit()
    return registro


def registrar_cambio(
    session,
    caso_id: int,
    entidad: str,
    entidad_id: int,
    campo: str,
    valor_anterior,
    valor_nuevo,
    usuario: str,
):
    registro = RegistroCambio(
        caso_id=caso_id,
        entidad=entidad,
        entidad_id=entidad_id,
        campo=campo,
        valor_anterior=str(valor_anterior) if valor_anterior is not None else None,
        valor_nuevo=str(valor_nuevo) if valor_nuevo is not None else None,
        usuario=usuario,
    )
    session.add(registro)
    session.commit()
    return registro
