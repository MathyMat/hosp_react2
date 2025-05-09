import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HistorialPersonal = () => {
  const [doctores, setDoctores] = useState([]);

  useEffect(() => {
    const fetchDoctores = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/doctores`);
        setDoctores(res.data);
      } catch (error) {
        console.error('Error al obtener doctores:', error);
      }
    };

    fetchDoctores();
  }, []);

  return (
    <div className="overflow-x-auto p-4">
      <table className="table-auto w-full text-sm text-left text-gray-300 border border-gray-700">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="px-4 py-2 text-center">Foto</th>
            <th className="px-4 py-2">Empleado</th>
            <th className="px-4 py-2">Especialidad</th>
            <th className="px-4 py-2">Correo</th>
            <th className="px-4 py-2">Fecha Nacimiento</th>
            <th className="px-4 py-2">Estado</th>
            <th className="px-4 py-2">Última Actividad</th>
          </tr>
        </thead>
        <tbody>
          {doctores.map((doc, index) => (
            <tr key={index} className="border-t border-gray-600">
              <td className="px-4 py-2 text-center">
                <img
                  src={`/${doc.foto}`}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover mx-auto"
                />
              </td>
              <td className="px-4 py-2">
                <div>{`${doc.nombre} ${doc.apellidos}`}</div>
                <div className="text-xs text-gray-400">ID: DOC-{doc.id}</div>
              </td>
              <td className="px-4 py-2">{doc.especialidad}</td>
              <td className="px-4 py-2">{doc.correo}</td>
              <td className="px-4 py-2">
                {new Date(doc.fecha_nacimiento).toLocaleDateString()}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    doc.genero === 'Femenino' ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'
                  }`}
                >
                  {doc.genero === 'Femenino' ? 'De Licencia' : 'Activo'}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="text-xs text-gray-400">Última conexión</div>
                <div className="text-sm">Hoy, 08:00 AM</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistorialPersonal;
