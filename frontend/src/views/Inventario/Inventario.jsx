// src/views/Inventario/RegistroInventarioHospital.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Componentes de CoreUI React
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput,
  CFormLabel, CRow, CAlert, CSpinner, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter, CCardImage, CCardTitle, CCardText, CFormSelect,
  CBadge, CImage
} from '@coreui/react';

// Componente CIcon de CoreUI Icons React
import CIcon from '@coreui/icons-react';

// Iconos individuales del paquete @coreui/icons
import { 
    cilMedicalCross, 
    cilTrash, 
    cilWarning, 
    cilCheckCircle,
    cilXCircle, 
    cilInfo,
    cilList, 
    cilPencil, 
    cilSave, 
    cilLayers
} from '@coreui/icons'; 

// ASUME QUE TIENES UNA IMAGEN PLACEHOLDER EN ESTA RUTA
import placeholderInsumoImg from '../../assets/images/placeholder-insumo.png'; // Ajusta esta ruta si es diferente

import { API_BASE_URL } from '../../config/apiConfig';

const RegistroInventarioHospital = () => {
  const [inventario, setInventario] = useState([]);
  const [formulario, setFormulario] = useState({ 
    nombre: '', 
    cantidad: '0', 
    descripcion: '', 
    categoria: '', 
    fotoInsumo: null 
  });
  const [previewForm, setPreviewForm] = useState(placeholderInsumoImg);
  
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false); // For Add Modal
  const [error, setError] = useState(''); // General error for inventory list

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [idParaEliminar, setIdParaEliminar] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationModalConfig, setNotificationModalConfig] = useState({ 
    title: '', message: '', color: 'info', icon: cilInfo 
  });

  // State for Add Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // State for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [insumoAEditar, setInsumoAEditar] = useState(null);
  const [previewEdit, setPreviewEdit] = useState(placeholderInsumoImg);
  const [loadingEdit, setLoadingEdit] = useState(false);
  
  const fileInputRef = useRef(null); // For Add Modal
  const editFileInputRef = useRef(null); // For Edit Modal

  const opcionesCategoria = [
    { label: 'Seleccione Categoría...', value: '' },
    { label: 'Medicamentos', value: 'Medicamentos' },
    { label: 'Material Quirúrgico', value: 'Material Quirúrgico' },
    { label: 'Equipamiento Médico', value: 'Equipamiento Médico' },
    { label: 'Suministros Generales', value: 'Suministros Generales' },
    { label: 'Limpieza', value: 'Limpieza' },
    { label: 'Oficina', value: 'Oficina' },
    { label: 'Otro', value: 'Otro' },
  ];

  const mostrarNotificacion = (title, message, type = 'info') => {
    let icon = cilInfo; let color = type;
    if (type === 'success') icon = cilCheckCircle;
    else if (type === 'error') { icon = cilWarning; color = 'danger'; }
    else if (type === 'warning') icon = cilWarning;
    setNotificationModalConfig({ title, message, color, icon });
    setShowNotificationModal(true);
  };

  const cargarInventario = async () => {
    console.log("FRONTEND: Cargando inventario...");
    setLoading(true); setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/inventario`);
      console.log("FRONTEND: Datos crudos de inventario recibidos:", JSON.stringify(res.data.slice(0,2), null, 2));
      
      const inventarioProcesado = Array.isArray(res.data) ? res.data.map(item => {
        if (!item || typeof item.id === 'undefined') { 
            console.warn("Item inválido recibido del backend:", item);
            return null; 
        }
        return {
            ...item,
            fotoBase64: item.fotoBase64 !== undefined ? item.fotoBase64 : null
        };
      }).filter(item => item !== null) : []; 

      console.log("FRONTEND: Inventario procesado para estado:", JSON.stringify(inventarioProcesado.slice(0,2), null, 2));
      setInventario(inventarioProcesado);
    } catch (err) {
      console.error("FRONTEND: Error al cargar inventario:", err);
      setError('Error al cargar la lista de inventario. Verifique la conexión o intente más tarde.');
      setInventario([]);
    } finally {
      setLoading(false);
    }
  };

  // Handles change for the Add Insumo form (now in modal)
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "fotoInsumo") {
      if (files && files[0]) {
        const file = files[0];
        if (file.size > 5 * 1024 * 1024) {
            mostrarNotificacion("Archivo Grande", "La imagen no debe exceder los 5MB.", "warning");
            if(fileInputRef.current) fileInputRef.current.value = null;
            setFormulario(prev => ({ ...prev, fotoInsumo: null }));
            setPreviewForm(placeholderInsumoImg);
            return;
        }
        setFormulario(prev => ({ ...prev, fotoInsumo: file }));
        setPreviewForm(URL.createObjectURL(file));
      } else {
        setFormulario(prev => ({ ...prev, fotoInsumo: null }));
        setPreviewForm(placeholderInsumoImg);
      }
    } else {
      setFormulario(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetFormulario = () => {
    setFormulario({ nombre: '', cantidad: '0', descripcion: '', categoria: '', fotoInsumo: null });
    setPreviewForm(placeholderInsumoImg);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const agregarInsumo = async (e) => {
    e.preventDefault();
    if (!formulario.nombre.trim() || !formulario.cantidad.trim() || !formulario.descripcion.trim() || !formulario.categoria) {
      mostrarNotificacion('Campos Incompletos', 'Por favor, complete Nombre, Cantidad, Descripción y Categoría.', 'warning');
      return;
    }
    if (isNaN(Number(formulario.cantidad)) || Number(formulario.cantidad) < 0) {
      mostrarNotificacion('Cantidad Inválida', 'La cantidad debe ser un número no negativo.', 'warning');
      return;
    }
    setFormLoading(true);
    const formData = new FormData();
    formData.append('nombre', formulario.nombre);
    formData.append('cantidad', formulario.cantidad);
    formData.append('descripcion', formulario.descripcion);
    formData.append('categoria', formulario.categoria);
    if (formulario.fotoInsumo) formData.append('fotoInsumo', formulario.fotoInsumo);

    try {
      const response = await axios.post(`${API_BASE_URL}/inventario`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarNotificacion('Éxito', response.data?.mensaje || 'Insumo agregado.', 'success');
      resetFormulario();
      setShowAddModal(false); // Close Add modal on success
      if (response.data.insumo && typeof response.data.insumo.id !== 'undefined') {
        const nuevoInsumo = { ...response.data.insumo, fotoBase64: response.data.insumo.fotoBase64 !== undefined ? response.data.insumo.fotoBase64 : null };
        setInventario(prev => [nuevoInsumo, ...prev].sort((a,b) => b.id - a.id ));
      } else {
        console.warn("Respuesta de agregarInsumo no contenía un insumo válido, recargando lista completa.");
        cargarInventario();
      }
    } catch (err) {
      console.error("Error al agregar insumo:", err);
      mostrarNotificacion('Error', err.response?.data?.mensaje || err.response?.data?.error || 'Error al agregar el insumo.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const solicitarEliminarInsumo = (id) => { 
    const insumo = inventario.find(item => item && item.id === id);
    if (insumo) {
        setIdParaEliminar(id); 
        setShowDeleteModal(true); 
    } else {
        mostrarNotificacion("Error", `Insumo con ID ${id} no encontrado para eliminar.`, "error");
    }
  };

  const confirmarYEliminarInsumo = async () => {
    if (!idParaEliminar) return;
    setLoadingDelete(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/inventario/${idParaEliminar}`);
      mostrarNotificacion('Éxito', response.data?.mensaje || 'Insumo eliminado exitosamente.', 'success');
      setInventario(prev => prev.filter(item => item && item.id !== idParaEliminar));
    } catch (err) {
      console.error("Error al eliminar insumo:", err);
      mostrarNotificacion('Error', err.response?.data?.mensaje || err.response?.data?.error || 'Error al eliminar el insumo.', 'error');
    } finally {
      setLoadingDelete(false); setShowDeleteModal(false); setIdParaEliminar(null);
    }
  };

  const abrirModalEditar = (insumo) => {
    if(!insumo || typeof insumo.id === 'undefined'){
        mostrarNotificacion("Error", "No se pueden editar los datos de un insumo inválido.", "error");
        return;
    }
    setInsumoAEditar({
        id: insumo.id, nombre: insumo.nombre || '', cantidad: insumo.cantidad === null || insumo.cantidad === undefined ? '0' : String(insumo.cantidad),
        descripcion: insumo.descripcion || '', categoria: insumo.categoria || '',
        fotoBase64: insumo.fotoBase64, fotoInsumo: null 
    });
    setPreviewEdit(insumo.fotoBase64 ? `data:image/jpeg;base64,${insumo.fotoBase64}` : placeholderInsumoImg);
    setShowEditModal(true); // setError(''); // Not needed here, general error is for list
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    const fieldName = name.startsWith('edit_') ? name.substring(5) : name; 

    if (name === "fotoInsumo_edit") {
      if (files && files[0]) {
        const file = files[0];
         if (file.size > 5 * 1024 * 1024) {
            mostrarNotificacion("Archivo Grande", "La imagen no debe exceder los 5MB.", "warning");
            if(editFileInputRef.current) editFileInputRef.current.value = null;
            setInsumoAEditar(prev => prev ? ({ ...prev, fotoInsumo: null }) : null);
            setPreviewEdit(insumoAEditar?.fotoBase64 ? `data:image/jpeg;base64,${insumoAEditar.fotoBase64}` : placeholderInsumoImg);
            return;
        }
        setInsumoAEditar(prev => prev ? ({ ...prev, fotoInsumo: file }) : null);
        setPreviewEdit(URL.createObjectURL(file));
      } else {
        setInsumoAEditar(prev => prev ? ({ ...prev, fotoInsumo: null }) : null);
        setPreviewEdit(insumoAEditar?.fotoBase64 ? `data:image/jpeg;base64,${insumoAEditar.fotoBase64}` : placeholderInsumoImg);
      }
    } else {
      setInsumoAEditar(prev => prev ? ({ ...prev, [fieldName]: value }) : null);
    }
  };

  const guardarCambiosInsumo = async (e) => {
    e.preventDefault();
    if (!insumoAEditar || typeof insumoAEditar.id === 'undefined') {
      console.error("guardarCambiosInsumo: insumoAEditar es nulo o no tiene ID.", insumoAEditar);
      mostrarNotificacion('Error', 'No se puede guardar, datos del insumo no disponibles.', 'error');
      return;
    }
    if (!insumoAEditar.nombre?.trim() || !String(insumoAEditar.cantidad)?.trim() || !insumoAEditar.descripcion?.trim() || !insumoAEditar.categoria) {
        mostrarNotificacion('Campos Incompletos', 'Nombre, Cantidad, Descripción y Categoría son requeridos.', 'warning');
        return;
    }
    if (isNaN(Number(insumoAEditar.cantidad)) || Number(insumoAEditar.cantidad) < 0) {
      mostrarNotificacion('Cantidad Inválida', 'La cantidad debe ser un número no negativo.', 'warning');
      return;
    }
    setLoadingEdit(true);
    const formData = new FormData();
    formData.append('nombre', insumoAEditar.nombre);
    formData.append('cantidad', insumoAEditar.cantidad);
    formData.append('descripcion', insumoAEditar.descripcion);
    formData.append('categoria', insumoAEditar.categoria);
    if (insumoAEditar.fotoInsumo) formData.append('fotoInsumo', insumoAEditar.fotoInsumo);

    try {
      const response = await axios.put(`${API_BASE_URL}/inventario/${insumoAEditar.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      mostrarNotificacion('Éxito', response.data?.mensaje || 'Insumo actualizado.', 'success');
      
      const insumoActualizadoDesdeBackend = response.data.insumo; 
      if (!insumoActualizadoDesdeBackend || typeof insumoActualizadoDesdeBackend.id === 'undefined') {
          console.warn("La respuesta del backend para actualizar no contenía un insumo válido. Recargando lista completa.");
          cargarInventario();
      } else {
          const insumoParaEstado = {
              ...insumoActualizadoDesdeBackend,
              fotoBase64: insumoActualizadoDesdeBackend.fotoBase64 !== undefined 
                          ? insumoActualizadoDesdeBackend.fotoBase64 
                          : (insumoAEditar?.fotoBase64 || null)
          };
          setInventario(prev => prev.map(item => 
            (item && typeof item.id !== 'undefined' && item.id === insumoAEditar.id) ? insumoParaEstado : item
          ).filter(Boolean)); 
      }
      
      setShowEditModal(false); setInsumoAEditar(null); setPreviewEdit(placeholderInsumoImg);
      if (editFileInputRef.current) editFileInputRef.current.value = null;
    } catch (err) {
      console.error("Error al actualizar insumo:", err);
      mostrarNotificacion('Error', err.response?.data?.mensaje || err.response?.data?.error || 'Error al actualizar el insumo.', 'error');
    } finally {
      setLoadingEdit(false);
    }
  };

  useEffect(() => { cargarInventario(); }, []);

  if (loading && !inventario.length && error) {
    return ( 
        <div className="p-4"> 
            <CAlert color="danger" className="text-center">
                <h4 className="alert-heading"><CIcon icon={cilWarning} className="me-2" /> Error Crítico</h4>
                <p>{error}</p>
                <CButton color="primary" onClick={cargarInventario} disabled={loading}>
                    {loading ? <CSpinner size="sm" /> : "Reintentar"}
                </CButton>
            </CAlert> 
        </div> 
    );
  }

  return (
    <div className="inventario-view p-4">
      <CRow className="mb-3">
        <CCol className="text-end">
          <CButton color="primary" onClick={() => { resetFormulario(); setShowAddModal(true); }} className="px-4 py-2 shadow-sm">
            <CIcon icon={cilMedicalCross} className="me-2" />
            Agregar Insumo
          </CButton>
        </CCol>
      </CRow>

      {/* MODAL PARA AGREGAR INSUMO */}
      <CModal alignment="center" size="lg" visible={showAddModal} onClose={() => {setShowAddModal(false); resetFormulario();}} backdrop="static">
        <CModalHeader onClose={() => {setShowAddModal(false); resetFormulario();}}>
          <CModalTitle><CIcon icon={cilMedicalCross} className="me-2" /> Agregar Nuevo Insumo</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={agregarInsumo}>
          <CModalBody>
            <CRow className="g-3 mb-3">
              <CCol md={6}><CFormLabel htmlFor="add_nombre">Nombre *</CFormLabel><CFormInput id="add_nombre" name="nombre" value={formulario.nombre} onChange={handleFormChange} required /></CCol>
              <CCol md={6}><CFormLabel htmlFor="add_cantidad">Cantidad *</CFormLabel><CFormInput id="add_cantidad" name="cantidad" type="number" min="0" value={formulario.cantidad} onChange={handleFormChange} required /></CCol>
              <CCol md={6}><CFormLabel htmlFor="add_categoria">Categoría *</CFormLabel><CFormSelect id="add_categoria" name="categoria" value={formulario.categoria} onChange={handleFormChange} required>
                  {opcionesCategoria.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)}
              </CFormSelect></CCol>
              <CCol md={6}><CFormLabel htmlFor="add_fotoInsumo">Foto (Opcional)</CFormLabel><CFormInput type="file" id="add_fotoInsumo" name="fotoInsumo" accept="image/*" onChange={handleFormChange} ref={fileInputRef} />
              </CCol>
              <CCol xs={12}><CFormLabel htmlFor="add_descripcion">Descripción *</CFormLabel><CFormInput id="add_descripcion" component="textarea" name="descripcion" value={formulario.descripcion} onChange={handleFormChange} rows="3" required /></CCol>
              <CCol xs={12} className="text-center">
                {previewForm && <CImage src={previewForm} alt="Previsualización nuevo insumo" thumbnail width={150} className="mt-2 mb-2" />}
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={() => {setShowAddModal(false); resetFormulario();}} disabled={formLoading}>Cancelar</CButton>
            <CButton type="submit" color="primary" disabled={formLoading}>
              {formLoading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilSave} className="me-2" />}
              Guardar Insumo
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>


      <CCard className="shadow-sm mt-2"> {/* Reduced margin-top since the form is now a modal */}
        <CCardHeader className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <CIcon icon={cilList} className="me-2" /> Lista de Insumos Registrados
          </h5>
        </CCardHeader>
        <CCardBody>
          {loading && ( <div className="text-center p-5"><CSpinner color="primary" style={{ width: '3rem', height: '3rem' }}/><p className="mt-3">Cargando inventario...</p></div> )}
          {!loading && !inventario.length && !error && ( <CAlert color="info" className="text-center py-4"><CIcon icon={cilInfo} size="xl" className="mb-2"/><p className="h5">No hay insumos registrados.</p><p>Puede agregar nuevos insumos utilizando el botón "Agregar Insumo".</p></CAlert> )}
          {!loading && error && inventario.length === 0 && ( <CAlert color="danger" className="text-center py-4" dismissible onClose={() => setError('')}><CIcon icon={cilWarning} size="xl" className="mb-2"/><p className="h5">Error al Cargar</p><p>{error}</p><CButton color="danger" variant="outline" onClick={cargarInventario} className="mt-2" disabled={loading}>{loading ? <CSpinner size="sm"/>:"Reintentar"}</CButton></CAlert>)}

          {!loading && inventario.length > 0 && (
            <CRow xs={{ cols: 1 }} sm={{ cols: 2 }} md={{ cols: 3 }} lg={{ cols: 4 }} xl={{cols: 5}} className="g-4 mt-2">
              {inventario.map((item) => {
                if (!item || typeof item.id === 'undefined') { 
                  console.warn("Item de inventario inválido o sin ID, saltando renderizado:", item);
                  return null; 
                }
                return (
                <CCol key={item.id}>
                  <CCard className="h-100 shadow-sm inventory-card">
                    <CCardImage 
                      orientation="top" 
                      src={item.fotoBase64 ? `data:image/jpeg;base64,${item.fotoBase64}` : placeholderInsumoImg}
                      alt={item.nombre || "Insumo"}
                      style={{ height: '150px', objectFit: 'cover', borderBottom: '1px solid var(--cui-border-color-translucent)' }} 
                      onError={(e) => { e.target.onerror = null; e.target.src = placeholderInsumoImg; }}
                    />
                    <CCardBody className="d-flex flex-column p-3">
                      <CCardTitle className="h6 mb-1 text-truncate" title={item.nombre}>{item.nombre || "Sin Nombre"}</CCardTitle>
                      <CCardText className="small text-muted mb-1">
                        <CIcon icon={cilLayers} className="me-1" /> {item.categoria || 'Sin categoría'}
                      </CCardText>
                      <div className="mb-2 mt-auto pt-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <CBadge color={item.cantidad > 5 ? "success" : (item.cantidad > 0 ? "warning" : "danger")} shape="rounded-pill">
                            Stock: {typeof item.cantidad === 'number' ? item.cantidad : 0}
                          </CBadge>
                          <small className="text-muted">ID: {item.id}</small>
                        </div>
                        <CCardText className="small mb-2" style={{ maxHeight: '3em', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '1.5em', fontSize: '0.8rem' }}>
                          {item.descripcion || "Sin descripción."}
                        </CCardText>
                        <div className="d-flex justify-content-end border-top pt-2">
                          <CButton color="info" variant="outline" size="sm" onClick={() => abrirModalEditar(item)} className="me-1" title="Editar" disabled={loadingDelete || loadingEdit || loading}><CIcon icon={cilPencil} /></CButton>
                          <CButton color="danger" variant="outline" size="sm" onClick={() => solicitarEliminarInsumo(item.id)} disabled={loadingDelete || loadingEdit || loading} title="Eliminar"><CIcon icon={cilTrash} /></CButton>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              )})}
            </CRow>
          )}
        </CCardBody>
      </CCard>
      
      {/* MODAL DE NOTIFICACIÓN */}
      <CModal alignment="center" visible={showNotificationModal} onClose={() => setShowNotificationModal(false)}>
        <CModalHeader onClose={() => setShowNotificationModal(false)} className={`bg-${notificationModalConfig.color} text-white`}>
          <CModalTitle><CIcon icon={notificationModalConfig.icon} className="me-2" />{notificationModalConfig.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>{notificationModalConfig.message}</CModalBody>
        <CModalFooter>
          <CButton color={notificationModalConfig.color} onClick={() => setShowNotificationModal(false)}>Aceptar</CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <CModal alignment="center" visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader onClose={() => setShowDeleteModal(false)}>
          <CModalTitle><CIcon icon={cilWarning} className="me-2 text-danger" /> Confirmar Eliminación</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {(() => {
            if (!idParaEliminar || !inventario || inventario.length === 0) return `¿Está seguro de que desea eliminar el insumo con ID ${idParaEliminar || 'desconocido'}?`;
            const insumoEncontrado = inventario.find(item => item && item.id === idParaEliminar);
            const nombreInsumo = insumoEncontrado ? insumoEncontrado.nombre : `ID ${idParaEliminar}`;
            // Use dangerouslySetInnerHTML for the strong tag if needed or just concatenate
            return `¿Está seguro de que desea eliminar el insumo "${nombreInsumo}"? Esta acción no se puede deshacer.`;
          })()}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={loadingDelete}><CIcon icon={cilXCircle} className="me-1" />Cancelar</CButton>
          <CButton color="danger" onClick={confirmarYEliminarInsumo} disabled={loadingDelete}>
            {loadingDelete ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCheckCircle} className="me-1" />}Eliminar
          </CButton>
        </CModalFooter>
      </CModal>

      {/* MODAL DE EDICIÓN DE INSUMO */}
      {insumoAEditar && (
        <CModal alignment="center" size="lg" visible={showEditModal} onClose={() => {setShowEditModal(false); setInsumoAEditar(null); setPreviewEdit(placeholderInsumoImg); if(editFileInputRef.current) editFileInputRef.current.value = null;}} backdrop="static">
          <CModalHeader onClose={() => {setShowEditModal(false); setInsumoAEditar(null); setPreviewEdit(placeholderInsumoImg); if(editFileInputRef.current) editFileInputRef.current.value = null;}}>
            <CModalTitle><CIcon icon={cilPencil} className="me-2" /> Editar Insumo: {insumoAEditar.nombre}</CModalTitle>
          </CModalHeader>
          <CForm onSubmit={guardarCambiosInsumo}>
            <CModalBody>
              <CRow className="g-3">
                <CCol md={6}><CFormLabel htmlFor="edit_nombre">Nombre *</CFormLabel><CFormInput id="edit_nombre" name="nombre" value={insumoAEditar.nombre || ''} onChange={handleEditFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="edit_cantidad">Cantidad *</CFormLabel><CFormInput id="edit_cantidad" name="cantidad" type="number" min="0" value={insumoAEditar.cantidad || '0'} onChange={handleEditFormChange} required /></CCol>
                <CCol md={6}><CFormLabel htmlFor="edit_categoria">Categoría *</CFormLabel><CFormSelect id="edit_categoria" name="categoria" value={insumoAEditar.categoria || ''} onChange={handleEditFormChange} required>
                    {opcionesCategoria.map(op => <option key={op.value} value={op.value} disabled={op.value === ''}>{op.label}</option>)}
                </CFormSelect></CCol>
                 <CCol md={6}><CFormLabel htmlFor="edit_fotoInsumo_input">Cambiar Foto (Opcional)</CFormLabel><CFormInput type="file" id="edit_fotoInsumo_input" name="fotoInsumo_edit" accept="image/*" onChange={handleEditFormChange} ref={editFileInputRef} /></CCol>
                <CCol xs={12}><CFormLabel htmlFor="edit_descripcion">Descripción *</CFormLabel><CFormInput id="edit_descripcion" component="textarea" name="descripcion" value={insumoAEditar.descripcion || ''} onChange={handleEditFormChange} rows="3" required /></CCol>
                <CCol xs={12} className="text-center">
                  {previewEdit && <CImage src={previewEdit} alt="Previsualización para editar" thumbnail width={150} className="mt-2 mb-2" />}
                  {/* Conditionally render current image only if no new preview and current image exists */}
                  {!previewEdit && insumoAEditar.fotoBase64 && (
                    <div className="mt-2"><small className="text-muted">Foto actual:</small><br/><CImage src={`data:image/jpeg;base64,${insumoAEditar.fotoBase64}`} alt={`Foto de ${insumoAEditar.nombre}`} thumbnail width={100}/></div>
                  )}
                   {!previewEdit && !insumoAEditar.fotoBase64 && <CImage src={placeholderInsumoImg} alt="Sin foto actual" thumbnail width={100} className="mt-2 mb-2 opacity-50" />}
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" variant="outline" onClick={() => {setShowEditModal(false); setInsumoAEditar(null); setPreviewEdit(placeholderInsumoImg); if(editFileInputRef.current) editFileInputRef.current.value = null;}} disabled={loadingEdit}>Cancelar</CButton>
              <CButton type="submit" color="primary" disabled={loadingEdit}>
                {loadingEdit ? <CSpinner size="sm" className="me-2"/> : <CIcon icon={cilSave} className="me-2"/>} Guardar Cambios
              </CButton>
            </CModalFooter>
          </CForm>
        </CModal>
      )}
    </div>
  );
};

export default RegistroInventarioHospital;