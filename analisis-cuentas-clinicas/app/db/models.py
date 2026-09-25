import datetime as dt
import enum
import json

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class EstadoHallazgo(enum.StrEnum):
    PENDIENTE = "pendiente"
    APROBADO = "aprobado"
    DESCARTADO = "descartado"
    REQUIERE_ANTECEDENTES = "requiere_antecedentes"


class NivelConfianza(enum.StrEnum):
    ALTO = "alto"
    MEDIO = "medio"
    BAJO = "bajo"


class Caso(Base):
    __tablename__ = "casos"

    id = Column(Integer, primary_key=True)
    nombre_cliente = Column(String, nullable=False)
    rut_cliente = Column(String, nullable=True)
    isapre = Column(String, nullable=True)
    numero_cuenta = Column(String, nullable=True)
    prestador = Column(String, nullable=True)
    fecha_creacion = Column(DateTime, default=dt.datetime.utcnow)
    consentimiento_aceptado = Column(Boolean, default=False)
    consentimiento_fecha = Column(DateTime, nullable=True)
    aprobado_por_abogado = Column(Boolean, default=False)
    fecha_aprobacion = Column(DateTime, nullable=True)
    notas = Column(Text, nullable=True)

    documentos = relationship("Documento", back_populates="caso", cascade="all, delete-orphan")
    items = relationship("ItemCuenta", back_populates="caso", cascade="all, delete-orphan")
    hallazgos = relationship("Hallazgo", back_populates="caso", cascade="all, delete-orphan")
    accesos = relationship("RegistroAcceso", back_populates="caso", cascade="all, delete-orphan")
    cambios = relationship("RegistroCambio", back_populates="caso", cascade="all, delete-orphan")


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True)
    caso_id = Column(Integer, ForeignKey("casos.id"), nullable=False)
    nombre_archivo = Column(String, nullable=False)
    tipo_archivo = Column(String, nullable=False)
    ruta_archivo = Column(String, nullable=False)
    fecha_carga = Column(DateTime, default=dt.datetime.utcnow)
    texto_extraido = Column(Text, nullable=True)
    metodo_extraccion = Column(String, nullable=True)

    caso = relationship("Caso", back_populates="documentos")


class ItemCuenta(Base):
    __tablename__ = "items_cuenta"

    id = Column(Integer, primary_key=True)
    caso_id = Column(Integer, ForeignKey("casos.id"), nullable=False)
    documento_id = Column(Integer, ForeignKey("documentos.id"), nullable=True)

    numero_cuenta = Column(String, nullable=True)
    afiliado = Column(String, nullable=True)
    rut = Column(String, nullable=True)
    prestador = Column(String, nullable=True)
    isapre = Column(String, nullable=True)
    fecha = Column(String, nullable=True)
    diagnostico = Column(String, nullable=True)
    codigo_prestacion = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True)
    cantidad = Column(Float, nullable=True)
    valor_cobrado = Column(Float, nullable=True)
    valor_bonificado = Column(Float, nullable=True)
    copago = Column(Float, nullable=True)
    monto_no_cubierto = Column(Float, nullable=True)
    glosa = Column(Text, nullable=True)
    deducible = Column(Float, nullable=True)
    total = Column(Float, nullable=True)

    confianza_campos = Column(Text, nullable=True)  # JSON serializado: {campo: nivel}
    aprobado = Column(Boolean, default=False)
    editado_manualmente = Column(Boolean, default=False)

    caso = relationship("Caso", back_populates="items")
    documento = relationship("Documento")

    def get_confianza(self) -> dict:
        return json.loads(self.confianza_campos) if self.confianza_campos else {}

    def set_confianza(self, data: dict) -> None:
        self.confianza_campos = json.dumps(data, ensure_ascii=False)


class Hallazgo(Base):
    __tablename__ = "hallazgos"

    id = Column(Integer, primary_key=True)
    caso_id = Column(Integer, ForeignKey("casos.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items_cuenta.id"), nullable=True)

    tipo = Column(String, nullable=False)
    monto_discutible = Column(Float, default=0.0)
    prioridad = Column(String, nullable=False, default="media")
    explicacion_interna = Column(Text, nullable=True)
    documentos_faltantes = Column(Text, nullable=True)
    recomendacion_interna = Column(Text, nullable=True)
    estado = Column(String, default=EstadoHallazgo.PENDIENTE.value)
    fecha_creacion = Column(DateTime, default=dt.datetime.utcnow)

    caso = relationship("Caso", back_populates="hallazgos")
    item = relationship("ItemCuenta")


class RegistroAcceso(Base):
    __tablename__ = "registro_acceso"

    id = Column(Integer, primary_key=True)
    caso_id = Column(Integer, ForeignKey("casos.id"), nullable=False)
    usuario = Column(String, nullable=False)
    accion = Column(String, nullable=False)
    fecha = Column(DateTime, default=dt.datetime.utcnow)
    detalle = Column(Text, nullable=True)

    caso = relationship("Caso", back_populates="accesos")


class RegistroCambio(Base):
    __tablename__ = "registro_cambio"

    id = Column(Integer, primary_key=True)
    caso_id = Column(Integer, ForeignKey("casos.id"), nullable=False)
    entidad = Column(String, nullable=False)
    entidad_id = Column(Integer, nullable=True)
    campo = Column(String, nullable=True)
    valor_anterior = Column(Text, nullable=True)
    valor_nuevo = Column(Text, nullable=True)
    usuario = Column(String, nullable=False)
    fecha = Column(DateTime, default=dt.datetime.utcnow)

    caso = relationship("Caso", back_populates="cambios")
