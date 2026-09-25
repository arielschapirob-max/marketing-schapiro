from app.extraction.field_extraction import extraer_items_desde_texto


def test_lineas_de_encabezado_no_generan_items_fantasma():
    """Un RUT con puntos (ej. 22.222.222-2) calza con el patrón de montos;
    la línea 'RUT: ...' no debe interpretarse como un ítem de la cuenta.
    """
    texto = "\n".join(
        [
            "Afiliado: Paciente de Prueba",
            "RUT: 22.222.222-2",
            "Número de cuenta: CTA-2026-0099",
            "Fecha de emisión: 15-03-2026",
            "220305 Stent coronario liberador de fármaco $3.200.000 $1.800.000 $1.400.000",
        ]
    )
    items = extraer_items_desde_texto(texto, metodo="pdf_texto")

    assert len(items) == 1
    assert items[0]["codigo_prestacion"] == "220305"
    assert items[0]["valor_cobrado"] == 3200000.0
    montos_fantasma = {22222222.0, 20260099.0, 15032026.0}
    assert all(item.get("valor_cobrado") not in montos_fantasma for item in items)


def test_numero_de_cuenta_no_se_confunde_con_monto():
    texto = "Número de cuenta: 123.456.789\n110101 Consulta médica especialidad $45.000 $45.000"
    items = extraer_items_desde_texto(texto, metodo="pdf_texto")

    assert len(items) == 1
    assert items[0]["codigo_prestacion"] == "110101"


def test_item_legitimo_se_extrae_correctamente():
    texto = "330501 Día cama UCI adulto $1.800.000 $1.200.000 $600.000"
    items = extraer_items_desde_texto(texto, metodo="pdf_texto")

    assert len(items) == 1
    item = items[0]
    assert item["codigo_prestacion"] == "330501"
    assert item["descripcion"] == "Día cama UCI adulto"
    assert item["valor_cobrado"] == 1800000.0
    assert item["valor_bonificado"] == 1200000.0
    assert item["copago"] == 600000.0
