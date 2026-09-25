"""Identificación de dispositivos médicos relevantes en la descripción de un ítem.

Regla especial: no se asume que un stent no es una prótesis; puede ser una
endoprótesis vascular. La función solo identifica la categoría textual del
dispositivo — no emite ningún juicio sobre la corrección de su clasificación
arancelaria, cobertura o causal aplicada. Esa evaluación queda siempre a
cargo del abogado responsable, apoyado por el hallazgo generado en
``app.analysis.findings_engine``.
"""

DISPOSITIVOS_RELEVANTES = {
    "stent_coronario": ["stent coronario"],
    "stent_vascular": ["stent vascular", "stent periferico", "stent periférico"],
    "stent_graft": ["stent graft", "endoprotesis", "endoprótesis"],
    "stent_retriever": ["stent retriever", "trombectomia mecanica", "trombectomía mecánica"],
    "balon_angioplastia": ["balon de angioplastia", "balón de angioplastía", "balon angioplastia"],
    "guias_cateteres": ["guia", "guía", "cateter", "catéter"],
    "valvulas_cardiacas": [
        "valvula cardiaca",
        "válvula cardíaca",
        "valvula aortica",
        "válvula aórtica",
        "valvula mitral",
        "válvula mitral",
    ],
    "marcapasos": ["marcapasos"],
    "desfibriladores": ["desfibrilador", "cardiodesfibrilador"],
    "osteosintesis": [
        "osteosintesis",
        "osteosíntesis",
        "placa de osteosintesis",
        "tornillo de osteosintesis",
    ],
    "protesis_articulares": [
        "protesis de cadera",
        "prótesis de cadera",
        "protesis de rodilla",
        "prótesis de rodilla",
        "protesis articular",
        "prótesis articular",
    ],
    "mallas": ["malla quirurgica", "malla quirúrgica", "malla protesica", "malla protésica"],
    "lentes_intraoculares": ["lente intraocular", "lentes intraoculares"],
    "neuroquirurgicos": [
        "clip de aneurisma",
        "coil neuroquirurgico",
        "derivacion ventricular",
        "derivación ventricular",
        "dispositivo neuroquirurgico",
        "dispositivo neuroquirúrgico",
    ],
}


def identificar_dispositivo(descripcion: str) -> str | None:
    if not descripcion:
        return None
    texto = descripcion.lower()
    for categoria, palabras_clave in DISPOSITIVOS_RELEVANTES.items():
        for palabra in palabras_clave:
            if palabra in texto:
                return categoria
    return None
