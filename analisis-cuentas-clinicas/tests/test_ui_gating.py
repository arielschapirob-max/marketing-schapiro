"""Verifica, ejecutando el código real de las páginas (streamlit.testing.v1.AppTest,
sin necesidad de navegador), que los dos bloqueos exigidos estén realmente
implementados y no sean solo una advertencia visual:

1. El análisis de hallazgos está deshabilitado hasta que el abogado apruebe
   la revisión manual del caso.
2. La generación de la propuesta comercial está deshabilitada hasta que el
   abogado haya triado (estado distinto de "pendiente") todos los hallazgos.
"""

from datetime import datetime
from pathlib import Path

from streamlit.testing.v1 import AppTest

from app.db.database import get_session, init_db
from app.db.models import Caso, Hallazgo, ItemCuenta

PROYECTO = Path(__file__).resolve().parent.parent


def _crear_caso_con_item_aprobado(aprobado_por_abogado: bool) -> int:
    init_db()
    session = get_session()
    caso = Caso(
        nombre_cliente="Caso de prueba (gating)",
        consentimiento_aceptado=True,
        consentimiento_fecha=datetime.utcnow(),
        aprobado_por_abogado=aprobado_por_abogado,
        fecha_aprobacion=datetime.utcnow() if aprobado_por_abogado else None,
    )
    session.add(caso)
    session.commit()
    item = ItemCuenta(
        caso_id=caso.id, codigo_prestacion="110101", descripcion="Ítem de prueba", valor_cobrado=1000.0
    )
    session.add(item)
    session.commit()
    caso_id = caso.id
    session.close()
    return caso_id


def _boton_analizar(at):
    return next(b for b in at.button if "Analizar" in b.label)


def test_boton_analizar_hallazgos_bloqueado_sin_aprobacion():
    _crear_caso_con_item_aprobado(aprobado_por_abogado=False)
    at = AppTest.from_file(str(PROYECTO / "views/hallazgos.py")).run()
    assert _boton_analizar(at).disabled is True


def test_boton_analizar_hallazgos_habilitado_con_aprobacion():
    _crear_caso_con_item_aprobado(aprobado_por_abogado=True)
    at = AppTest.from_file(str(PROYECTO / "views/hallazgos.py")).run()
    assert _boton_analizar(at).disabled is False


def _boton_propuesta(at):
    return next(b for b in at.button if "propuesta comercial" in b.label.lower())


def test_boton_propuesta_bloqueado_sin_hallazgos():
    _crear_caso_con_item_aprobado(aprobado_por_abogado=True)
    at = AppTest.from_file(str(PROYECTO / "views/informes.py")).run()
    assert _boton_propuesta(at).disabled is True


def test_boton_propuesta_bloqueado_con_hallazgos_pendientes():
    caso_id = _crear_caso_con_item_aprobado(aprobado_por_abogado=True)
    session = get_session()
    session.add(Hallazgo(caso_id=caso_id, tipo="glosa_generica", estado="pendiente"))
    session.commit()
    session.close()

    at = AppTest.from_file(str(PROYECTO / "views/informes.py")).run()
    assert _boton_propuesta(at).disabled is True


def test_boton_propuesta_habilitado_cuando_todos_los_hallazgos_estan_triados():
    caso_id = _crear_caso_con_item_aprobado(aprobado_por_abogado=True)
    session = get_session()
    session.add(Hallazgo(caso_id=caso_id, tipo="glosa_generica", estado="descartado"))
    session.add(Hallazgo(caso_id=caso_id, tipo="cobertura_parcial", estado="aprobado"))
    session.commit()
    session.close()

    at = AppTest.from_file(str(PROYECTO / "views/informes.py")).run()
    assert _boton_propuesta(at).disabled is False
