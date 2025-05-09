import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HabitacionesPacientes = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [formulario, setFormulario] = useState({
    paciente_id: '',
    habitacion_disponible_id: '',
    fecha_ingreso: '',
    fecha_salida_estimada: '',
    doctor_id: '',
    estado_paciente: 'Estable',
    motivo_ingreso: ''
  });

  const API = import.meta.env.VITE_API_URL;

  const cargarAsignaciones = async () => {
    try {
      const res = await axios.get(`${API}/api/habitaciones/asignadas`);
      setAsignaciones(res.data);
    } catch (err) {
      alert('Error al cargar asignaciones');
    }
  };

  const cargarPacientes = async () => {
    try {
      const res = await axios.get(`${API}/api/pacientes`);
      setPacientes(res.data);
    } catch (err) {
      alert('Error al cargar pacientes');
    }
  };

  const cargarDoctores = async () => {
    try {
      const res = await axios.get(`${API}/api/doctores`);
      setDoctores(res.data);
    } catch (err) {
      alert('Error al cargar doctores');
    }
  };

  const cargarHabitacionesDisponibles = async () => {
    try {
      const res = await axios.get(`${API}/api/habitaciones/disponibles`);
      setHabitacionesDisponibles(res.data);
    } catch (err) {
      alert('Error al cargar habitaciones disponibles');
    }
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const asignarHabitacion = async () => {
    try {
      const datos = {
        paciente_id: formulario.paciente_id,
        habitacion_disponible_id: formulario.habitacion_disponible_id,
        fecha_ingreso: formulario.fecha_ingreso,
        fecha_salida_estimada: formulario.fecha_salida_estimada,
        medico_responsable: formulario.doctor_id,
        estado_paciente: formulario.estado_paciente,
        motivo_ingreso: formulario.motivo_ingreso
      };

      await axios.post(`${API}/api/habitaciones/asignar`, datos);

      alert('Habitación asignada correctamente');
      setFormulario({
        paciente_id: '',
        habitacion_disponible_id: '',
        fecha_ingreso: '',
        fecha_salida_estimada: '',
        doctor_id: '',
        estado_paciente: 'Estable',
        motivo_ingreso: ''
      });

      await cargarAsignaciones();
      await cargarHabitacionesDisponibles();
    } catch (err) {
      console.error(err);
      alert('Error al asignar habitación');
    }
  };

  const eliminarAsignacion = async (id) => {
    try {
      await axios.delete(`${API}/api/habitaciones/asignadas/${id}`);
      await cargarAsignaciones();
      await cargarHabitacionesDisponibles();
    } catch (err) {
      alert('Error al eliminar asignación');
    }
  };

  useEffect(() => {
    cargarAsignaciones();
    cargarPacientes();
    cargarDoctores();
    cargarHabitacionesDisponibles();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Registro de Habitaciones para Pacientes</h2>

      <div className="mb-3">
        <select className="form-control mb-2" name="paciente_id" value={formulario.paciente_id} onChange={handleChange}>
          <option value="">Seleccione un paciente</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
          ))}
        </select>

        <select className="form-control mb-2" name="habitacion_disponible_id" value={formulario.habitacion_disponible_id} onChange={handleChange}>
          <option value="">Seleccione una habitación</option>
          {habitacionesDisponibles.map(h => (
            <option key={h.id} value={h.id}>{h.numero} - {h.tipo}</option>
          ))}
        </select>

        <input className="form-control mb-2" type="datetime-local" name="fecha_ingreso" value={formulario.fecha_ingreso} onChange={handleChange} />
        <input className="form-control mb-2" type="datetime-local" name="fecha_salida_estimada" value={formulario.fecha_salida_estimada} onChange={handleChange} />

        <select className="form-control mb-2" name="doctor_id" value={formulario.doctor_id} onChange={handleChange}>
          <option value="">Seleccione un médico</option>
          {doctores.map(doc => (
            <option key={doc.id} value={doc.id}>{doc.nombre} {doc.apellido}</option>
          ))}
        </select>

        <select className="form-control mb-2" name="estado_paciente" value={formulario.estado_paciente} onChange={handleChange}>
          <option value="Estable">Estable</option>
          <option value="Observación">Observación</option>
          <option value="Crítico">Crítico</option>
        </select>

        <input className="form-control mb-2" type="text" name="motivo_ingreso" value={formulario.motivo_ingreso} onChange={handleChange} placeholder="Motivo de Ingreso" />

        <button className="btn btn-primary" onClick={asignarHabitacion}>Asignar Habitación</button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Paciente</th>
            <th>Habitación</th>
            <th>Ingreso</th>
            <th>Salida Estimada</th>
            <th>Médico</th>
            <th>Estado</th>
            <th>Motivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {asignaciones.map(a => (
            <tr key={a.id}>
              <td>{a.id}</td>
              <td>{pacientes.find(p => p.id === a.paciente_id)?.nombre || '-'}</td>
              <td>{a.numero_disponible} - {a.tipo_disponible}</td>
              <td>{new Date(a.fecha_ingreso).toLocaleString()}</td>
              <td>{new Date(a.fecha_salida_estimada).toLocaleString()}</td>
              <td>{doctores.find(d => d.id === a.doctor_id)?.nombre || '-'}</td>
              <td>{a.estado_paciente}</td>
              <td>{a.motivo_ingreso}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => eliminarAsignacion(a.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HabitacionesPacientes;
// HabitacionesPacientes.js