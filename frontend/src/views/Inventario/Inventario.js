import React, { useEffect, useState } from 'react'
import axios from 'axios'

const RegistroInventarioHospital = () => {
  const [inventario, setInventario] = useState([])
  const [formulario, setFormulario] = useState({ nombre: '', cantidad: '', descripcion: '' })

  const apiUrl = `${import.meta.env.VITE_API_URL}/api/inventario`

  const cargarInventario = async () => {
    try {
      const res = await axios.get(apiUrl)
      setInventario(res.data)
    } catch (err) {
      alert('Error al cargar inventario')
    }
  }

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const agregarInsumo = async () => {
    try {
      await axios.post(apiUrl, formulario)
      setFormulario({ nombre: '', cantidad: '', descripcion: '' })
      cargarInventario()
    } catch (err) {
      alert('Error al agregar')
    }
  }

  const eliminarInsumo = async (id) => {
    try {
      await axios.delete(`${apiUrl}/${id}`)
      cargarInventario()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  useEffect(() => {
    cargarInventario()
  }, [])

  return (
    <div className="container mt-4">
      <h2>Inventario Hospitalario</h2>

      <div className="mb-3">
        <input className="form-control mb-2" placeholder="Nombre" name="nombre" value={formulario.nombre} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Cantidad" name="cantidad" value={formulario.cantidad} onChange={handleChange} />
        <input className="form-control mb-2" placeholder="Descripción" name="descripcion" value={formulario.descripcion} onChange={handleChange} />
        <button className="btn btn-primary" onClick={agregarInsumo}>Agregar</button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inventario.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nombre}</td>
              <td>{item.cantidad}</td>
              <td>{item.descripcion}</td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => eliminarInsumo(item.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RegistroInventarioHospital
