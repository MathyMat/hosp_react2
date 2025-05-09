// Asumamos que este archivo se llamará FacturacionCoreUI.js o similar
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CForm,
    CFormInput,
    CFormLabel,
    CFormSelect,
    CRow,
    CAlert,
    CSpinner,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CInputGroup,
    CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDollar, cilPlus, cilDescription, cilList, cilWarning, cilPaperPlane, cilPeople } from '@coreui/icons';
import { API_BASE_URL } from '../../config/apiConfig';
// No necesitamos los CSS de PrimeReact aquí, asumimos que CoreUI CSS está cargado globalmente

export default function FacturacionServiciosCoreUI() {
    // --- Estados (se mantienen igual) ---
    const [selectedPaciente, setSelectedPaciente] = useState(null); // Almacenará el objeto paciente completo
    const [descripcionItem, setDescripcionItem] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState(''); // Usar string para CFormInput type number
    const [precioTotalItem, setPrecioTotalItem] = useState(0);
    const [listaPacientes, setListaPacientes] = useState([]);
    const [itemsFacturados, setItemsFacturados] = useState([]);
    const [numeroFactura, setNumeroFactura] = useState(generarNumeroFactura());
    const [loading, setLoading] = useState(false); // Para el guardado de items
    const [loadingPacientes, setLoadingPacientes] = useState(false);
    
    // Para mensajes de CoreUI CAlert
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- Constantes (se mantienen igual) ---


    // --- Funciones (se mantienen igual, con adaptaciones para mensajes) ---
    function generarNumeroFactura() {
        const prefix = "FAC-";
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        return prefix + randomNum;
    }

    useEffect(() => {
        const fetchPacientes = async () => {
            setLoadingPacientes(true);
            setError('');
            try {
                const response = await axios.get(`${API_BASE_URL}/pacientes`);
                const pacientesFormateados = response.data.map(paciente => ({
                    id: paciente.id,
                    nombreCompleto: `${paciente.nombre || ''} ${paciente.apellido || ''}`.trim(),
                    dni: paciente.dni,
                    direccion: paciente.direccion
                }));
                setListaPacientes(pacientesFormateados);
            } catch (err) {
                console.error('Error al obtener pacientes:', err);
                setError('No se pudieron cargar los pacientes. Verifica la conexión con el servidor.');
            } finally {
                setLoadingPacientes(false);
            }
        };
        fetchPacientes();
    }, []);

    useEffect(() => {
        const cant = Number(cantidad) || 0;
        const pu = Number(precioUnitario) || 0;
        setPrecioTotalItem(cant * pu);
    }, [cantidad, precioUnitario]);

    const handleAddItemAFactura = async () => {
        setError('');
        setSuccess('');

        if (!selectedPaciente || !descripcionItem.trim() || !cantidad || cantidad <= 0 || precioUnitario === '' || parseFloat(precioUnitario) < 0) {
            setError('Seleccione Paciente y complete Descripción, Cantidad (>0) y Precio Unitario (>=0).');
            return;
        }

        const pacienteSeleccionado = listaPacientes.find(p => p.id === parseInt(selectedPaciente));
        if (!pacienteSeleccionado) {
            setError('Paciente seleccionado no es válido.');
            return;
        }

        const itemParaTabla = {
            id: Date.now(), // ID local temporal
            fechaHora: new Date(),
            pacienteId: pacienteSeleccionado.id,
            pacienteNombre: pacienteSeleccionado.nombreCompleto,
            dni: pacienteSeleccionado.dni,
            direccion: pacienteSeleccionado.direccion,
            descripcion: descripcionItem.trim(),
            cantidad: Number(cantidad),
            precioUnitario: parseFloat(precioUnitario),
            precioTotal: precioTotalItem,
        };

        setItemsFacturados(prevItems => [...prevItems, itemParaTabla]);
        setSuccess(`"${itemParaTabla.descripcion}" agregado a la tabla local. Intentando guardar...`);

        // Resetear campos del formulario
        // No reseteamos el paciente para permitir múltiples items para el mismo
        setDescripcionItem('');
        setCantidad(1);
        setPrecioUnitario('');
        // setSelectedPaciente(null); // Opcional: resetear paciente

        setLoading(true);
        try {
            const payload = {
                numero_factura: numeroFactura,
                paciente_id: pacienteSeleccionado.id,
                descripcion: itemParaTabla.descripcion,
                cantidad: itemParaTabla.cantidad,
                precio_unitario: itemParaTabla.precioUnitario,
                precio_total: itemParaTabla.precioTotal
            };

            await axios.post(`${ API_BASE_URL } `, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            setSuccess(`Ítem "${itemParaTabla.descripcion}" guardado correctamente en el servidor.`);
            // Aquí podrías actualizar el item en `itemsFacturados` si el backend devuelve un ID o más datos
        } catch (err) {
            console.error('Error detallado al guardar ítem en backend:', err);
            let detailMessage = 'No se pudo conectar con el servidor. Intente más tarde.';
             if (err.response) {
                detailMessage = `Error del servidor (${err.response.status}): ${err.response.data?.message || err.response.data?.error || err.message}`;
            } else if (err.request) {
                detailMessage = 'No se recibió respuesta del servidor. Verifica que esté corriendo y accesible.';
            } else if (err.code === 'ECONNABORTED') {
                detailMessage = 'Timeout: La solicitud tardó demasiado en responder.';
            }
            setError(`Error al Guardar Ítem: "${itemParaTabla.descripcion}". ${detailMessage} (El ítem permanece en la tabla local).`);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return 'S/ 0.00';
        return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        try {
            const dateObj = new Date(dateString);
            if (isNaN(dateObj.getTime())) return 'Fecha Inválida';
            return dateObj.toLocaleString('es-PE', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch (e) {
            console.error("Error formateando fecha:", dateString, e);
            return 'Fecha Inválida';
        }
    };

    const calcularTotalGeneral = () => {
        return itemsFacturados.reduce((total, item) => total + (Number(item.precioTotal) || 0), 0);
    };

    const generarFacturaPDF = () => {
        if (itemsFacturados.length === 0) {
            setError('No hay ítems para generar la factura.');
            return;
        }
        setError('');
        setSuccess('');

        const doc = new jsPDF();
        const fechaEmision = new Date();
        
        const primerItem = itemsFacturados[0] || {};
        const pacienteActualParaFactura = listaPacientes.find(p => p.id === (selectedPaciente ? parseInt(selectedPaciente) : primerItem.pacienteId)) || {
            nombreCompleto: primerItem.pacienteNombre || 'N/A',
            dni: primerItem.dni || 'N/A',
            direccion: primerItem.direccion || 'N/A'
        };


        // Encabezado
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185); // Azul similar a CoreUI primary
        doc.text('MEDIASSIST CENTRO MÉDICO', 105, 20, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.text('RUC: 20456789012', 105, 26, { align: 'center' });
        doc.text('Av. La Cultura 1234 - Cusco, Perú', 105, 30, { align: 'center' });
        doc.text('Teléfono: (084) 234567 | Email: contacto@mediassist.pe', 105, 34, { align: 'center' });

        doc.setLineWidth(0.2);
        doc.setDrawColor(180);
        doc.line(15, 40, 195, 40);

        // Título de Factura
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text('FACTURA ELECTRÓNICA', 15, 50);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`N°: ${numeroFactura}`, 195, 50, { align: 'right' });

        // Datos del Paciente y Emisión
        doc.setFontSize(10);
        doc.setTextColor(50);
        doc.text('DATOS DEL CLIENTE:', 15, 60);
        doc.text('FECHA DE EMISIÓN:', 130, 60);

        doc.setTextColor(0);
        doc.setFontSize(9);
        doc.text(`Nombre/Razón Social: ${pacienteActualParaFactura.nombreCompleto}`, 15, 66);
        doc.text(`DNI/RUC: ${pacienteActualParaFactura.dni}`, 15, 71);
        doc.text(`Dirección: ${pacienteActualParaFactura.direccion || 'No especificada'}`, 15, 76);

        doc.text(`${fechaEmision.toLocaleDateString('es-PE')}`, 130, 66);
        doc.text(`${fechaEmision.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, 130, 71);

        const headers = [
            [{ content: 'Cant.', styles: { halign: 'center'} },
             { content: 'Descripción', styles: { halign: 'left'} },
             { content: 'P. Unit. (S/)', styles: { halign: 'right'} },
             { content: 'Total (S/)', styles: { halign: 'right'} }]
        ];

        const data = itemsFacturados.map((item) => [
            { content: item.cantidad, styles: { halign: 'center' } },
            { content: item.descripcion, styles: { halign: 'left', cellWidth: 'wrap' } },
            { content: formatCurrency(item.precioUnitario).replace('S/\u00A0', ''), styles: { halign: 'right' } },
            { content: formatCurrency(item.precioTotal).replace('S/\u00A0', ''), styles: { halign: 'right' } }
        ]);

        const totalGeneral = calcularTotalGeneral();
        const igvRate = 0.18;
        const subtotal = totalGeneral / (1 + igvRate);
        const igv = totalGeneral - subtotal;

        const totalRows = [
             [{ content: 'Subtotal:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', textColor: 50 } },
              { content: `S/ ${subtotal.toFixed(2)}`, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }],
             [{ content: 'IGV (18%):', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', textColor: 50 } },
              { content: `S/ ${igv.toFixed(2)}`, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }],
             [{ content: 'TOTAL:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, textColor: 0 } },
              { content: `S/ ${totalGeneral.toFixed(2)}`, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } }]
        ];

        autoTable(doc, {
            startY: 85,
            head: headers,
            body: data,
            foot: totalRows,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9, valign: 'middle' },
            footStyles: { fillColor: [230, 230, 230], textColor: 0, fontSize: 9, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto', halign: 'left' },
                2: { cellWidth: 25, halign: 'right' },
                3: { cellWidth: 25, halign: 'right' }
            },
            margin: { left: 15, right: 15 },
            styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
            didDrawPage: function (hookData) {
                doc.setFontSize(8);
                doc.setTextColor(100);
                const pageHeight = doc.internal.pageSize.height;
                doc.text('Gracias por confiar en MediAssist', 105, pageHeight - 15, { align: 'center' });
                doc.text('Representación impresa de la Factura Electrónica.', 105, pageHeight - 10, { align: 'center' });
            }
        });

        doc.save(`Factura_${numeroFactura}_${pacienteActualParaFactura.dni || 'SIN_DNI'}.pdf`);
        setSuccess("Factura PDF generada y descargada.");
    };

    // Manejo para CFormInput type="number" que devuelven string
    const handleCantidadChange = (e) => {
        const val = e.target.value;
        if (val === '' || (Number(val) >= 1) ) {
            setCantidad(val);
        }
    };
    
    const handlePrecioUnitarioChange = (e) => {
        const val = e.target.value;
         // Permite vacío, números positivos y decimales
        if (val === '' || /^\d*\.?\d*$/.test(val) && parseFloat(val) >= 0) {
            setPrecioUnitario(val);
        } else if (val === '') {
            setPrecioUnitario('');
        }
    };
    
    const handlePacienteChange = (e) => {
        const pacienteId = e.target.value;
        setSelectedPaciente(pacienteId);
        // Si ya hay items, no permitir cambiar de paciente (o advertir y limpiar items)
        if (itemsFacturados.length > 0 && itemsFacturados.some(item => item.pacienteId !== parseInt(pacienteId))) {
            setError("Ya hay ítems para un paciente diferente. Para cambiar de paciente, primero genere o limpie la factura actual.");
            // Opcional: resetear items si se quiere permitir el cambio
            // setItemsFacturados([]);
            // setNumeroFactura(generarNumeroFactura());
        }
    };


    // Si hay un error crítico y no hay datos, mostrar solo el error
    if (error && loadingPacientes === false && !listaPacientes.length) {
        return (
            <div className="p-4">
                <CAlert color="danger" className="text-center">
                    <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico</h4>
                    <p>{error}</p>
                    <hr />
                    <CButton color="primary" onClick={() => window.location.reload()} disabled={loadingPacientes}>
                      {loadingPacientes ? <CSpinner size="sm" /> : "Reintentar Carga"}
                    </CButton>
                </CAlert>
            </div>
        );
    }

    return (
        <div className="facturacion-servicios-view p-4">
            <CCard className="mb-4">
                <CCardHeader>
                    <h4 className="mb-0 d-flex align-items-center">
                        <CIcon icon={cilDollar} className="me-2" />
                        Facturación de Servicios - MediAssist
                    </h4>
                </CCardHeader>
                <CCardBody>
                    {error && <CAlert color="danger" dismissible onClose={() => setError('')}>{error}</CAlert>}
                    {success && <CAlert color="success" dismissible onClose={() => setSuccess('')}>{success}</CAlert>}
                    
                    <CForm onSubmit={(e) => e.preventDefault()} className="modern-form">
                        <div className="mb-3 p-3 border rounded">
                            <h5 className="mb-3 text-primary">Agregar Ítem a Facturar</h5>
                            <CRow className="g-3">
                                <CCol md={6} xl={4}>
                                    <CFormLabel htmlFor="pacienteFactura">Paciente *</CFormLabel>
                                    <CFormSelect 
                                        id="pacienteFactura" 
                                        value={selectedPaciente || ''} 
                                        onChange={handlePacienteChange}
                                        disabled={loadingPacientes || loading || (itemsFacturados.length > 0)}
                                        required
                                    >
                                        <option value="">{loadingPacientes ? "Cargando..." : "Seleccione Paciente"}</option>
                                        {listaPacientes.map(p => (
                                            <option key={p.id} value={p.id}>{p.nombreCompleto} (DNI: {p.dni})</option>
                                        ))}
                                    </CFormSelect>
                                </CCol>
                                <CCol md={6} xl={8}>
                                    <CFormLabel htmlFor="descripcionItem">Descripción *</CFormLabel>
                                    <CFormInput
                                        id="descripcionItem"
                                        value={descripcionItem}
                                        onChange={(e) => setDescripcionItem(e.target.value)}
                                        placeholder="Ej: Consulta Médica, Radiografía..."
                                        disabled={loading}
                                        required
                                    />
                                </CCol>
                                <CCol xs={6} md={3} xl={2}>
                                    <CFormLabel htmlFor="cantidadFactura">Cantidad *</CFormLabel>
                                    <CFormInput
                                        type="number"
                                        id="cantidadFactura"
                                        value={cantidad}
                                        onChange={handleCantidadChange}
                                        min="1"
                                        disabled={loading}
                                        required
                                    />
                                </CCol>
                                <CCol xs={6} md={3} xl={3}>
                                    <CFormLabel htmlFor="precioUnitario">P. Unitario (S/) *</CFormLabel>
                                    <CInputGroup>
                                        <CInputGroupText>S/</CInputGroupText>
                                        <CFormInput
                                            type="number"
                                            id="precioUnitario"
                                            value={precioUnitario}
                                            onChange={handlePrecioUnitarioChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            disabled={loading}
                                            required
                                        />
                                    </CInputGroup>
                                </CCol>
                                <CCol md={3} xl={3}>
                                    <CFormLabel htmlFor="precioTotalItem">Total Ítem</CFormLabel>
                                    <CFormInput
                                        id="precioTotalItem"
                                        value={formatCurrency(precioTotalItem)}
                                        readOnly
                                        className="fw-bold text-end"
                                    />
                                </CCol>
                                <CCol md={3} xl={4} className="d-flex align-items-end justify-content-center justify-content-md-end">
                                    <CButton
                                        color="primary"
                                        onClick={handleAddItemAFactura}
                                        disabled={!selectedPaciente || !descripcionItem || cantidad <= 0 || precioUnitario === '' || parseFloat(precioUnitario) < 0 || loading || (itemsFacturados.length > 0 && itemsFacturados[0].pacienteId !== parseInt(selectedPaciente))}
                                        className="w-100 w-md-auto"
                                    >
                                        {loading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilPlus} className="me-2" />}
                                        Agregar Ítem
                                    </CButton>
                                </CCol>
                            </CRow>
                        </div>
                    </CForm>
                </CCardBody>
            </CCard>

            <CCard className="mt-4">
                <CCardHeader>
                    <h5 className="mb-0 d-flex align-items-center">
                        <CIcon icon={cilList} className="me-2" />
                        Ítems en Factura Actual (N°: {numeroFactura})
                    </h5>
                </CCardHeader>
                <CCardBody>
                    {loading && itemsFacturados.length === 0 && ( // Muestra spinner solo si está cargando y no hay items aún.
                        <div className="text-center p-5">
                            <CSpinner color="primary" />
                            <p className="mt-2">Procesando...</p>
                        </div>
                    )}
                    {!loading && itemsFacturados.length === 0 && (
                        <CAlert color="info" className="text-center">No hay ítems agregados a esta factura.</CAlert>
                    )}

                    {itemsFacturados.length > 0 && (
                        <div className="table-responsive">
                            <CTable hover className="modern-table">
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell>Fecha/Hora</CTableHeaderCell>
                                        <CTableHeaderCell>Paciente</CTableHeaderCell>
                                        <CTableHeaderCell>Descripción</CTableHeaderCell>
                                        <CTableHeaderCell className="text-end">Cant.</CTableHeaderCell>
                                        <CTableHeaderCell className="text-end">P. Unit. (S/)</CTableHeaderCell>
                                        <CTableHeaderCell className="text-end">Total (S/)</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {itemsFacturados.map(item => (
                                        <CTableRow key={item.id}>
                                            <CTableDataCell>{formatDateTime(item.fechaHora)}</CTableDataCell>
                                            <CTableDataCell>{item.pacienteNombre}</CTableDataCell>
                                            <CTableDataCell>{item.descripcion}</CTableDataCell>
                                            <CTableDataCell className="text-end">{item.cantidad}</CTableDataCell>
                                            <CTableDataCell className="text-end">{formatCurrency(item.precioUnitario)}</CTableDataCell>
                                            <CTableDataCell className="text-end">{formatCurrency(item.precioTotal)}</CTableDataCell>
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                        </div>
                    )}

                    {itemsFacturados.length > 0 && (
                        <>
                            <CRow className="mt-4 justify-content-end">
                                <CCol md={5} lg={4}>
                                    <CCard className="bg-light">
                                        <CCardBody className="p-3">
                                            <div className="d-flex justify-content-between">
                                                <span>Subtotal:</span>
                                                <span className="fw-semibold">{formatCurrency(calcularTotalGeneral() / (1 + 0.18))}</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span>IGV (18%):</span>
                                                <span className="fw-semibold">{formatCurrency(calcularTotalGeneral() - (calcularTotalGeneral() / (1 + 0.18)))}</span>
                                            </div>
                                            <hr className="my-2"/>
                                            <div className="d-flex justify-content-between fs-5">
                                                <span className="fw-bold">Total Factura:</span>
                                                <span className="fw-bold text-primary">{formatCurrency(calcularTotalGeneral())}</span>
                                            </div>
                                        </CCardBody>
                                    </CCard>
                                </CCol>
                            </CRow>
                            <CRow className="mt-4">
                                <CCol className="text-center">
                                    <CButton
                                        color="danger"
                                        size="lg"
                                        onClick={generarFacturaPDF}
                                        disabled={loading}
                                    >
                                        <CIcon icon={cilDescription} className="me-2" />
                                        Descargar Factura PDF
                                    </CButton>
                                    <CButton
                                        color="success"
                                        variant="outline"
                                        size="lg"
                                        className="ms-3"
                                        onClick={() => {
                                            setItemsFacturados([]);
                                            setNumeroFactura(generarNumeroFactura());
                                            setSelectedPaciente(null); // Resetear paciente para nueva factura
                                            setSuccess("Factura limpiada. Listo para una nueva.");
                                        }}
                                        disabled={loading}
                                    >
                                        <CIcon icon={cilPaperPlane} className="me-2" />
                                        Nueva Factura
                                    </CButton>
                                </CCol>
                            </CRow>
                        </>
                    )}
                </CCardBody>
            </CCard>
        </div>
    );
}