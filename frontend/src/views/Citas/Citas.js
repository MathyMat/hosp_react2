import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [formulario, setFormulario] = useState({
    paciente_id: '',
    doctor_id: '',
    fecha: '',
    motivo: '',
    estado: 'pendiente',
    notas: ''
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const cargarCitas = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/citas`);
      setCitas(res.data);
    } catch (err) {
      alert('Error al cargar citas');
    }
  };

  const cargarPacientes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pacientes`);
      setPacientes(res.data);
    } catch (err) {
      alert('Error al cargar pacientes');
    }
  };

  const cargarDoctores = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/doctores`);
      setDoctores(res.data);
    } catch (err) {
      alert('Error al cargar doctores');
    }
  };

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const agregarCita = async () => {
    try {
      await axios.post(`${API_URL}/api/citas`, formulario);
      setFormulario({
        paciente_id: '',
        doctor_id: '',
        fecha: '',
        motivo: '',
        estado: 'pendiente',
        notas: ''
      });
      cargarCitas();
    } catch (err) {
      alert('Error al agregar cita');
    }
  };

  const eliminarCita = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/citas/${id}`);
      cargarCitas();
    } catch (err) {
      alert('Error al eliminar cita');
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarPacientes();
    cargarDoctores();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Gestión de Citas</h2>

      <div className="mb-3">
        <select className="form-control mb-2" name="paciente_id" value={formulario.paciente_id} onChange={handleChange}>
          <option value="">Seleccione Paciente</option>
          {pacientes.map(p => (
            <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
          ))}
        </select>

        <select className="form-control mb-2" name="doctor_id" value={formulario.doctor_id} onChange={handleChange}>
          <option value="">Seleccione Doctor</option>
          {doctores.map(d => (
            <option key={d.id} value={d.id}>{d.nombre} {d.apellidos}</option>
          ))}
        </select>

        <input className="form-control mb-2" type="datetime-local" name="fecha" value={formulario.fecha} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Motivo de la cita" name="motivo" value={formulario.motivo} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Notas adicionales" name="notas" value={formulario.notas} onChange={handleChange} />

        <button className="btn btn-primary" onClick={agregarCita}>Agregar Cita</button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Paciente</th>
            <th>Doctor</th>
            <th>Fecha</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Notas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citas.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{pacientes.find(p => p.id === c.paciente_id)?.nombre || '-'}</td>
              <td>{doctores.find(d => d.id === c.doctor_id)?.nombre || '-'}</td>
              <td>{new Date(c.fecha).toLocaleString()}</td>
              <td>{c.motivo}</td>
              <td>{c.estado}</td>
              <td>{c.notas}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => eliminarCita(c.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Citas;
