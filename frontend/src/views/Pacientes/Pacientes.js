import React, { useEffect, useState } from 'react'
import axios from 'axios'

const RegistroPacientes = () => {
  const [pacientes, setPacientes] = useState([])
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    genero: '',
    telefono: '',
    direccion: '',
    historial: ''
  })
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/pacientes`


  const cargarPacientes = async () => {
    try {
      const res = await axios.get(apiUrl)
      setPacientes(res.data)
    } catch (err) {
      alert('Error al cargar pacientes')
    }
  }

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const agregarPaciente = async () => {
    try {
      await axios.post(apiUrl, formulario)
      setFormulario({
        nombre: '',
        apellido: '',
        dni: '',
        fecha_nacimiento: '',
        genero: '',
        telefono: '',
        direccion: '',
        historial: ''
      })
      cargarPacientes()
    } catch (err) {
      alert('Error al agregar paciente')
    }
  }

  const eliminarPaciente = async (id) => {
    try {
      await axios.delete(`${apiUrl}/${id}`)
      cargarPacientes()
    } catch (err) {
      alert('Error al eliminar paciente')
    }
  }

  useEffect(() => {
    cargarPacientes()
  }, [])

  return (
    <div className="container mt-4">
      <h2>Registro de Pacientes</h2>

      <div className="mb-3">
        <input className="form-control mb-2" placeholder="Nombre" name="nombre" value={formulario.nombre} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Apellido" name="apellido" value={formulario.apellido} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="DNI" name="dni" value={formulario.dni} onChange={handleChange} />
        <input className="form-control mb-2" type="date" name="fecha_nacimiento" value={formulario.fecha_nacimiento} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Género" name="genero" value={formulario.genero} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Teléfono" name="telefono" value={formulario.telefono} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Dirección" name="direccion" value={formulario.direccion} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Historial médico breve" name="historial" value={formulario.historial} onChange={handleChange} />
        <button className="btn btn-primary" onClick={agregarPaciente}>Agregar Paciente</button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>DNI</th>
            <th>Fecha Nac.</th>
            <th>Género</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Historial</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.apellido}</td>
              <td>{p.dni}</td>
              <td>{new Date(p.fecha_nacimiento).toLocaleDateString()}</td>
              <td>{p.genero}</td>
              <td>{p.telefono}</td>
              <td>{p.direccion}</td>
              <td>{p.historial}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => eliminarPaciente(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RegistroPacientes
