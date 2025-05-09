import React, { useState, useRef, useEffect } from "react";
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import axios from 'axios';

import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

export default function FacturacionServicios() {
    const [selectedPaciente, setSelectedPaciente] = useState(null);
    const [descripcionItem, setDescripcionItem] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState(null);
    const [precioTotalItem, setPrecioTotalItem] = useState(0);
    const [listaPacientes, setListaPacientes] = useState([]);
    const [itemsFacturados, setItemsFacturados] = useState([]);
    const [numeroFactura, setNumeroFactura] = useState(generarNumeroFactura());
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    function generarNumeroFactura() {
        const prefix = "FAC-";
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        return prefix + randomNum;
    }

    useEffect(() => {
        const fetchPacientes = async () => {
            try {
                setLoading(true);
                const response = await axios.get((`${API_BASE_URL}/api/facturacion`));
                const pacientesFormateados = response.data.map(paciente => ({
                    id: paciente.id,
                    nombreCompleto: `${paciente.nombre} ${paciente.apellido}`,
                    dni: paciente.dni,
                    direccion: paciente.direccion
                }));
                setListaPacientes(pacientesFormateados);
            } catch (error) {
                console.error('Error al obtener pacientes:', error);
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los pacientes',
                    life: 3000
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPacientes();
    }, []);

    useEffect(() => {
        const cant = typeof cantidad === 'number' ? cantidad : 0;
        const pu = typeof precioUnitario === 'number' ? precioUnitario : 0;
        setPrecioTotalItem(cant * pu);
    }, [cantidad, precioUnitario]);
    const API_URL = import.meta.env.VITE_API_URL;
    // Asegúrate que coincida con el puerto del servidor

const handleAddItemAFactura = async () => {
  try {
    setLoading(true);
    
    const payload = {
      numero_factura: numeroFactura,
      paciente_id: selectedPaciente.id,
      descripcion: descripcionItem.trim(),
      cantidad: cantidad,
      precio_unitario: precioUnitario,
      precio_total: precioTotalItem
    };

    // Verificación en consola
    console.log('Enviando a:', `${API_BASE_URL}/api/facturacion`);
    console.log('Datos:', payload);

    const response = await axios.post(`${API_BASE_URL}/api/facturacion`, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // Timeout de 5 segundos
    });

    // Procesar respuesta exitosa
    const nuevoItem = {
      ...response.data.item,
      fechaHora: new Date(response.data.item.fecha_emision),
      pacienteNombre: response.data.item.paciente_nombre
    };

    setItemsFacturados(prev => [...prev, nuevoItem]);
    toast.current.show({
      severity: 'success',
      summary: 'Ítem Guardado',
      detail: 'Facturación registrada correctamente',
      life: 3000
    });

    // Resetear formulario
    setDescripcionItem('');
    setCantidad(1);
    setPrecioUnitario(0);

  } catch (error) {
    console.error('Error detallado:', {
      message: error.message,
      config: error.config,
      response: error.response?.data,
      status: error.response?.status
    });

    let errorMessage = 'Error al conectar con el servidor';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'Endpoint no encontrado. Verifica la URL.';
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout: El servidor no respondió a tiempo';
    }

    toast.current.show({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    });
  } finally {
    setLoading(false);
  }
};
    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'S/ 0.00';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDateTime = (rowData) => {
        if (!rowData.fechaHora) return '';
        try {
            return rowData.fechaHora.toLocaleString('es-PE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) { return 'Fecha inválida'; }
    };

    const calcularTotalGeneral = () => {
        return itemsFacturados.reduce((total, item) => total + item.precioTotal, 0);
    };

    const generarFacturaPDF = () => {
        if (itemsFacturados.length === 0) {
            toast.current.show({
                severity: 'warn',
                summary: 'Factura Vacía',
                detail: 'No hay ítems para generar la factura.',
                life: 3000
            });
            return;
        }

        const doc = new jsPDF();
        const fechaEmision = new Date();
        const paciente = itemsFacturados[0];

        // Encabezado
        doc.setFont('helvetica');
        doc.setFontSize(16);
        doc.setTextColor(33, 37, 41);
        doc.text('MEDIASSIST CENTRO MÉDICO', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text('RUC: 20456789012', 105, 26, { align: 'center' });
        doc.text('Av. La Cultura 1234 - Cusco, Perú', 105, 32, { align: 'center' });
        doc.text('Teléfono: (084) 234567 - Email: contacto@mediassist.pe', 105, 38, { align: 'center' });

        doc.setDrawColor(200, 200, 200);
        doc.line(15, 45, 195, 45);

        // Título
        doc.setFontSize(14);
        doc.setTextColor(41, 128, 185);
        doc.text('FACTURA ELECTRÓNICA', 105, 55, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(33, 37, 41);
        doc.text(`N° ${numeroFactura}`, 105, 61, { align: 'center' });

        // Datos paciente
        doc.setFontSize(12);
        doc.text('DATOS DEL PACIENTE:', 15, 70);

        doc.setFontSize(10);
        doc.text(`Nombre: ${paciente.pacienteNombre}`, 15, 77);
        doc.text(`DNI: ${paciente.dni}`, 15, 83);
        doc.text(`Dirección: ${paciente.direccion}`, 15, 89);
        doc.text(`Fecha emisión: ${fechaEmision.toLocaleDateString('es-PE')}`, 140, 77);
        doc.text(`Hora emisión: ${fechaEmision.toLocaleTimeString('es-PE')}`, 140, 83);

        // Tabla de items
        const headers = [
            ['Ítem', 'Descripción', 'Cantidad', 'P. Unitario (S/)', 'Total (S/)']
        ];

        const data = itemsFacturados.map((item, index) => [
            index + 1,
            item.descripcion,
            item.cantidad,
            item.precioUnitario.toFixed(2),
            item.precioTotal.toFixed(2)
        ]);

        const subtotal = calcularTotalGeneral();
        const igv = subtotal * 0.18;
        const total = subtotal + igv;

        data.push(['', '', '', 'Subtotal:', subtotal.toFixed(2)]);
        data.push(['', '', '', 'IGV (18%):', igv.toFixed(2)]);
        data.push(['', '', '', 'TOTAL:', total.toFixed(2)]);

        autoTable(doc, {
            startY: 95,
            head: headers,
            body: data,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 30, halign: 'right' },
                4: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: 15 },
            styles: { fontSize: 9 },
            didDrawPage: function (data) {
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text('Gracias por confiar en MediAssist', 105, 285, { align: 'center' });
                doc.text('Este documento es válido como factura electrónica según Ley N° 29633', 105, 290, { align: 'center' });
            }
        });

        doc.save(`Factura_${numeroFactura}_${paciente.dni}.pdf`);
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <div className="card p-fluid p-4 shadow-2 border-round">
                <h2 className="text-center text-2xl font-bold mb-5 text-primary">
                    <i className="pi pi-file-pdf mr-2"></i>
                    Facturación de Servicios - MediAssist
                </h2>

                <div className="formgrid grid mb-5 p-3 border-1 border-round border-gray-300">
                    <h4 className="col-12 mb-3 text-lg font-semibold">Agregar Ítem a Facturar</h4>
                    <div className="field col-12 md:col-6 lg:col-4">
                        <label htmlFor="pacienteFactura" className="font-semibold block mb-2">Paciente *</label>
                        <Dropdown
                            id="pacienteFactura"
                            value={selectedPaciente}
                            options={listaPacientes}
                            onChange={(e) => setSelectedPaciente(e.value)}
                            optionLabel="nombreCompleto"
                            placeholder="Seleccione un paciente"
                            filter
                            filterBy="nombreCompleto,dni"
                            filterPlaceholder="Buscar paciente..."
                            showClear
                            className={`w-full ${!selectedPaciente ? 'p-invalid' : ''}`}
                            loading={loading}
                        />
                    </div>
                    <div className="field col-12 md:col-6 lg:col-8">
                        <label htmlFor="descripcionItem" className="font-semibold block mb-2">Descripción *</label>
                        <InputText
                            id="descripcionItem"
                            value={descripcionItem}
                            onChange={(e) => setDescripcionItem(e.target.value)}
                            placeholder="Ej: Consulta médica, Radiografía, Medicamentos..."
                            className={!descripcionItem ? 'p-invalid' : ''}
                            disabled={loading}
                        />
                    </div>
                    <div className="field col-6 md:col-3 lg:col-2">
                        <label htmlFor="cantidadFactura" className="font-semibold block mb-2">Cantidad *</label>
                        <InputNumber
                            id="cantidadFactura"
                            value={cantidad}
                            onValueChange={(e) => setCantidad(e.value)}
                            mode="decimal"
                            min={1}
                            showButtons
                            buttonLayout="horizontal"
                            step={1}
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                            className={cantidad === null || cantidad <= 0 ? 'p-invalid' : ''}
                            disabled={loading}
                        />
                    </div>
                    <div className="field col-6 md:col-3 lg:col-3">
                        <label htmlFor="precioUnitario" className="font-semibold block mb-2">Precio Unitario (S/) *</label>
                        <InputNumber
                            id="precioUnitario"
                            value={precioUnitario}
                            onValueChange={(e) => setPrecioUnitario(e.value)}
                            mode="currency"
                            currency="PEN"
                            locale="es-PE"
                            minFractionDigits={2}
                            min={0}
                            placeholder="0.00"
                            className={precioUnitario === null || precioUnitario < 0 ? 'p-invalid' : ''}
                            disabled={loading}
                        />
                    </div>
                    <div className="field col-12 md:col-3 lg:col-3 align-items-end flex">
                        <div className="p-3 border-1 border-gray-200 border-round bg-gray-50 w-full text-center">
                            <span className="text-gray-600 block mb-1">Total Ítem:</span>
                            <span className="font-bold text-xl">{formatCurrency(precioTotalItem)}</span>
                        </div>
                    </div>
                    <div className="col-12 md:col-3 lg:col-4 flex align-items-end justify-content-center">
                        <Button
                            label="Agregar Ítem"
                            icon="pi pi-plus"
                            onClick={handleAddItemAFactura}
                            className="p-button-info w-full md:w-auto"
                            disabled={!selectedPaciente || !descripcionItem || cantidad === null || cantidad <= 0 || precioUnitario === null || precioUnitario < 0 || loading}
                            loading={loading}
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-center text-xl font-semibold mb-4">Ítems en Factura Actual</h3>
                    <DataTable
                        value={itemsFacturados}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No hay ítems agregados a esta factura."
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        dataKey="id"
                        sortField="fechaHora"
                        sortOrder={-1}
                        loading={loading}
                    >
                        <Column field="fechaHora" header="Fecha/Hora" body={formatDateTime} sortable style={{ minWidth: '10rem' }} />
                        <Column field="pacienteNombre" header="Paciente" sortable style={{ minWidth: '12rem' }} />
                        <Column field="descripcion" header="Descripción" sortable style={{ minWidth: '15rem' }} />
                        <Column field="cantidad" header="Cant." sortable style={{ minWidth: '5rem', textAlign: 'right' }} />
                        <Column field="precioUnitario" header="P. Unitario (S/)" body={(rowData) => formatCurrency(rowData.precioUnitario)} sortable style={{ minWidth: '8rem', textAlign: 'right' }} />
                        <Column field="precioTotal" header="Total Ítem (S/)" body={(rowData) => formatCurrency(rowData.precioTotal)} sortable style={{ minWidth: '8rem', textAlign: 'right' }} />
                    </DataTable>
                    <div className="flex justify-content-end mt-4">
                        <div className="p-3 border-1 border-round bg-blue-50">
                            <h4 className="text-xl font-bold text-blue-800">
                                Total Factura: {formatCurrency(calcularTotalGeneral())}
                            </h4>
                        </div>
                    </div>
                    <div className="flex justify-content-center mt-4">
                        <Button
                            label="Descargar Factura PDF"
                            icon="pi pi-file-pdf"
                            className="p-button-danger p-button-lg"
                            onClick={generarFacturaPDF}
                            disabled={itemsFacturados.length === 0 || loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}