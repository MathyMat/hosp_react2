import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumenRes, actividadesRes, distribucionRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/resumen`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/actividades`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/distribucion`),
        ]);
        
        const resumen = resumenRes.data;
        const actividades = actividadesRes.data;
        const distribucion = distribucionRes.data;

        const totalPacientes = resumen.pacientes;

        setStats({
          overview: [
            { title: 'Pacientes Registrados', value: resumen.pacientes, percent: 100 },
            { title: 'Citas Totales', value: resumen.citas, percent: 100 },
            { title: 'Habitaciones Ocupadas', value: resumen.ocupadas, percent: resumen.ocupadas },
            { title: 'Emergencias Hoy', value: resumen.emergencias, percent: 100 },
            { title: 'Tiempo Promedio de Espera', value: `${resumen.espera} min`, percent: 100 },
          ],
          recentAppointments: actividades.map(cita => ({
            paciente: cita.paciente,
            doctor: cita.doctor,
            especialidad: cita.especialidad,
            fecha: new Date(cita.fecha).toLocaleString(),
            estado: cita.estado,
          })),
          genderDistribution: [
            {
              title: 'Masculino',
              value: Math.round((distribucion.sexos.masculinos / totalPacientes) * 100),
            },
            {
              title: 'Femenino',
              value: Math.round((distribucion.sexos.femeninos / totalPacientes) * 100),
            },
          ],
          citaTipos: distribucion.tipos.map(t => ({
            title: t.tipo,
            value: t.total,
            percent: t.total,
          })),
        });
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      }
    };

    fetchData();
  }, []);

  if (!stats)
    return (
      <div className="flex justify-center items-center min-h-screen bg-light">
        <Spinner animation="border" variant="primary" />
        <span className="ms-3 text-muted">Cargando datos del dashboard...</span>
      </div>
    );

  return (
    <div className="container py-4">
      <div className="row g-4">
        {stats.overview.map((item, i) => (
          <div key={i} className="col-md-6 col-xl-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="text-muted">{item.title}</h6>
                <h4 className="fw-bold text-primary">{item.value}</h4>
                <div className="progress mt-2" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Últimas Citas</h5>
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Doctor</th>
                      <th>Especialidad</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentAppointments.map((cita, i) => (
                      <tr key={i}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(cita.paciente)}&background=random`}
                              alt={cita.paciente}
                              className="rounded-circle me-2"
                              width="40"
                              height="40"
                            />
                            <span>{cita.paciente}</span>
                          </div>
                        </td>
                        <td>{cita.doctor}</td>
                        <td>{cita.especialidad}</td>
                        <td>{cita.fecha}</td>
                        <td>
                          <span className="badge bg-light text-dark">{cita.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Distribución por Género</h5>
              {stats.genderDistribution.map((item, i) => (
                <div key={i} className="d-flex align-items-center mb-3">
                  <span className="me-3" style={{ width: '100px' }}>{item.title}</span>
                  <div className="progress flex-grow-1 me-3" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-muted">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title">Tipos de Citas</h5>
              {stats.citaTipos.map((item, i) => (
                <div key={i} className="d-flex align-items-center mb-3">
                  <span className="me-3" style={{ width: '120px' }}>{item.title}</span>
                  <div className="progress flex-grow-1 me-3" style={{ height: '6px' }}>
                    <div
                      className="progress-bar bg-info"
                      role="progressbar"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <span className="text-muted">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
