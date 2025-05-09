// src/views/Dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Make sure axios is imported
import { API_BASE_URL } from '../../config/apiConfig'; // Import your API base URL
// ... other C CoreUI imports remain the same ...
import {
  // ... your existing icons ...
  cilMedicalCross // Example for Pacientes Registrados
} from '@coreui/icons';


const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDoctorTab, setActiveDoctorTab] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentDayActivities, setCurrentDayActivities] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch data from your new backend endpoint
        const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
        setStats(response.data);
        console.log("Dashboard data from API:", response.data);

        // Initial calendar activities for today (if API provides it for current month)
        const todayKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(currentMonth.getDate()).padStart(2, '0')}`;
        if (response.data.calendarActivities && response.data.calendarActivities[todayKey]) {
            setCurrentDayActivities(response.data.calendarActivities[todayKey]);
        }


      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        setError(error.response?.data?.message || error.message || 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Fetch only on mount

  const handleDayClick = (day) => {
    const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (stats?.calendarActivities && stats.calendarActivities[dateKey]) {
        setCurrentDayActivities(stats.calendarActivities[dateKey]);
    } else {
        setCurrentDayActivities([]);
    }
    // Optionally, you can also set the 'current selected day' in state if you want to highlight it differently
  };

  const renderCalendarDays = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday etc.

    let days = [];
    // Adjust for week starting on Sunday (if getDay() is 0-indexed for Sunday)
    for (let i = 0; i < startingDay; i++) {
      days.push(<CCol key={`empty-${i}`} className="p-1 text-center" style={{minHeight:'40px'}}></CCol>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
        const hasActivity = stats?.calendarActivities && stats.calendarActivities[dateKey] && stats.calendarActivities[dateKey].length > 0;

      days.push(
        <CCol key={day} className="p-1 text-center">
            <CButton
                color={isToday ? "primary" : (hasActivity ? "light" : "transparent")}
                className={`w-100 p-1 ${isToday ? 'text-white' : (hasActivity ? 'fw-bold' : '')}`}
                variant={isToday || hasActivity ? undefined : 'ghost'}
                size="sm"
                style={{border: hasActivity && !isToday ? '1px solid #0d6efd' : undefined, minHeight:'40px'}}
                onClick={() => handleDayClick(day)} // Add click handler
            >
             {day}
          </CButton>
        </CCol>
      );
    }
    return days;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(prev => {
        const newMonthDate = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
        // TODO: Optionally, re-fetch calendarActivities for the new month if your API supports it
        // For now, it will use the initially fetched activities or clear them
        setCurrentDayActivities([]); // Clear activities when month changes
        return newMonthDate;
    });
  };

  // ... (loading, error, !stats checks remain the same)


  


  const SmallLineChart = ({ data, borderColor }) => (
    <CChartLine
      data={{
        labels: data.map((_, index) => `Day ${index + 1}`),
        datasets: [
          {
            label: 'Data',
            data: data,
            borderColor: borderColor,
            fill: false,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: getStyle('--cui-border-color-translucent') } },
        },
      }}
    />
  );
  const cardStyle = { borderRadius:'1rem', height: '100%' };
  const widgetIconSize = "lg";

  // Determine room availability percentages
  const totalManagedRooms = (stats.roomAvailability?.available || 0) + (stats.roomAvailability?.occupied || 0);
  // For General/Private, you'll need total counts of each type from your `habitaciones_disponibles` table
  // These are placeholders, replace with actual counts if available from API
  const totalGeneralRooms = stats.roomAvailability?.general_total || (stats.roomAvailability?.available + stats.roomAvailability?.occupied) / 2 || 1; // Avoid division by zero
  const totalPrivateRooms = stats.roomAvailability?.private_total || (stats.roomAvailability?.available + stats.roomAvailability?.occupied) / 2 || 1;
  
  // Assuming 'occupied' rooms are distributed between general and private based on some logic
  // This is a simplification. A real system would track occupancy per room type.
  const occupiedGeneral = Math.min(stats.roomAvailability?.general_occupied || Math.floor(stats.roomAvailability?.occupied / 2), totalGeneralRooms);
  const occupiedPrivate = Math.min(stats.roomAvailability?.private_occupied || Math.ceil(stats.roomAvailability?.occupied / 2), totalPrivateRooms);

  const availableGeneralRooms = totalGeneralRooms - occupiedGeneral;
  const availablePrivateRooms = totalPrivateRooms - occupiedPrivate;


  return (
    <>
      <CRow className="g-3 mb-4">
        {/* Total Doctors Widget */}
        <CCol sm={6} lg={3}>
          <CCard style={{ ...cardStyle, backgroundColor: '#4f46e5', color: 'white' }}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CIcon icon={cilHospital} size={widgetIconSize} />
                  {/* <CIcon icon={cilOptions} /> */} {/* Removed options icon for cleaner look */}
                </div>
                <div style={{fontSize:'0.85rem', opacity:0.9}}>Total Doctores</div>
                <div className="fs-4 fw-bold mt-1">{stats.totalDoctors?.value || 0}+ 
                  {/* <CBadge color="light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.totalDoctors.change || 0}%</CBadge> */}
                </div>
              </div>
              <div>
                <CChartBar /* ... data from stats.totalDoctors.chartData (still mock or needs API update) ... */ />
                <div style={{fontSize:'0.75rem', marginTop:'0.5rem', opacity:0.8}}>
                    {/* Incremento de {stats.totalDoctors.increase || 0} pacientes int. últimos 7 días */}
                    Actualmente registrados.
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Book Appointment / Total Appointments Today Widget */}
        <CCol sm={6} lg={3}>
          <CCard style={cardStyle}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CIcon icon={cilCalendarCheck} size={widgetIconSize} className="text-primary"/> {/* Changed icon */}
                  {/* <CIcon icon={cilOptions} /> */}
                </div>
                <div style={{fontSize:'0.85rem'}}>Citas Programadas (Hoy)</div>
                <div className="fs-4 fw-bold mt-1">{(stats.bookAppointment?.value || 0).toLocaleString()} 
                  {/* <CBadge color="success-light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.bookAppointment.change || 0}%</CBadge> */}
                </div>
                <div style={{fontSize:'0.75rem', color:'grey', marginTop:'0.1rem'}}>
                    {/* Datos últimos 7 días: {(stats.bookAppointment?.visitors || 0).toLocaleString()} visitas */}
                    Total para la fecha actual.
                </div>
              </div>
              <div>
                <SmallLineChart data={stats.bookAppointment?.chartData || []} borderColor={getStyle('--cui-primary')} />
                <div className="text-end" style={{fontSize:'0.75rem', color:'grey', marginTop:'0.2rem'}}>
                    {(stats.bookAppointment?.daily || 0).toLocaleString()} hoy
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Room Availability Widget */}
        <CCol sm={6} lg={3}>
            <CCard style={cardStyle}>
                <CCardBody className="p-3 d-flex flex-column justify-content-between">
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <CIcon icon={cilBed} size={widgetIconSize} className="text-warning"/> {/* Changed icon */}
                            {/* <CIcon icon={cilOptions} /> */}
                        </div>
                        <div style={{fontSize:'0.85rem'}}>Disponibilidad Habitaciones</div>
                        <div className="fs-4 fw-bold mt-1">
                            {(stats.roomAvailability?.available || 0).toLocaleString()} Disp.
                            <span className="text-muted small"> / {(totalManagedRooms || 0).toLocaleString()} Tot.</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center" style={{fontSize:'0.8rem'}}>
                            <span>General Disp.</span>
                            <span className="fw-semibold">{availableGeneralRooms} / {totalGeneralRooms}</span>
                        </div>
                        <CProgress thin value={(availableGeneralRooms / (totalGeneralRooms || 1)) * 100} color="secondary" className="mt-1 mb-2"/>
                        
                        <div className="d-flex justify-content-between align-items-center" style={{fontSize:'0.8rem'}}>
                            <span>Privada Disp.</span>
                            <span className="fw-semibold">{availablePrivateRooms} / {totalPrivateRooms}</span>
                        </div>
                        <CProgress thin value={(availablePrivateRooms / (totalPrivateRooms || 1)) * 100} color="warning" className="mt-1"/>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>
        
        {/* Overall Visitor / Total Patients Widget */}
        <CCol sm={6} lg={3}>
          <CCard style={cardStyle}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
                <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                    <CIcon icon={cilPeople} size={widgetIconSize} className="text-info"/> {/* Changed icon */}
                    {/* <CIcon icon={cilOptions} /> */}
                    </div>
                    <div style={{fontSize:'0.85rem'}}>Total Pacientes Registrados</div>
                    <div className="fs-4 fw-bold mt-1">{(stats.overallVisitor?.value || 0).toLocaleString()}
                      {/* <CBadge color="success-light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.overallVisitor.change || 0}%</CBadge> */}
                    </div>
                    <div style={{fontSize:'0.75rem', color:'grey', marginTop:'0.1rem'}}>
                        {/* {stats.overallVisitor?.topClinicsText || "Pacientes activos en el sistema."} */}
                        Pacientes activos en el sistema.
                    </div>
                </div>
                <div>
                    <SmallLineChart data={stats.overallVisitor?.chartData || []} borderColor={getStyle('--cui-info')} />
                    <div className="text-end" style={{fontSize:'0.75rem', color:'grey', marginTop:'0.2rem'}}>
                        {/* {(stats.overallVisitor?.daily || 0).toLocaleString()} hoy */}
                        Promedio diario: {(stats.overallVisitor?.daily || 0).toLocaleString()}
                    </div>
                </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Patient Overview Chart */}
      <CRow className="g-3 mb-4">
        <CCol lg={8}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold"><CIcon icon={cilMedicalCross} className="me-2"/>Resumen de Pacientes (Últimos 6 Meses)</h6>
              {/* Dropdown for time range can be added back if API supports it */}
            </CCardHeader>
            <CCardBody>
                <div className="d-flex justify-content-start small mb-3">
                    {stats.patientOverview?.datasets.map(ds => (
                        <div key={ds.label} className="me-3 d-flex align-items-center">
                            <span style={{display:'inline-block', width:'10px', height:'10px', backgroundColor:ds.backgroundColor, borderRadius:'50%', marginRight:'5px'}}></span>
                            {ds.label}
                        </div>
                    ))}
                </div>
                <CChartBar
                    style={{ height: '250px' }}
                    data={{
                        labels: stats.patientOverview?.labels || [],
                        datasets: stats.patientOverview?.datasets || [],
                    }}
                    options={{ /* ... options, ensure scales.y.ticks.callback uses value/1 for actual numbers if not thousands ... */ 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, stacked: true, ticks:{font:{size:10}} },
                            y: { grid: { color: getStyle('--cui-border-color-translucent') }, stacked: true, 
                                ticks: { 
                                    callback: (value) => Number.isInteger(value) ? value : '', // Show only integer ticks
                                    font:{size:10} 
                                } 
                            }
                        },
                    }}
                />
            </CCardBody>
          </CCard>
        </CCol>

        {/* Calendar Card */}
        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <CButton color="transparent" size="sm" className="p-1" onClick={() => changeMonth(-1)}><CIcon icon={cilChevronLeft}/></CButton>
              <h6 className="mb-0 fw-semibold">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h6>
              <CButton color="transparent" size="sm" className="p-1" onClick={() => changeMonth(1)}><CIcon icon={cilChevronRight}/></CButton>
            </CCardHeader>
            <CCardBody className="p-2">
              <CRow xs={{cols: 7}} className="text-center small text-muted mb-2">
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => <CCol key={day} className="px-0">{day}</CCol>)}
              </CRow>
              <CRow xs={{cols: 7}} className="g-1">
                {renderCalendarDays()}
              </CRow>
              <div className="mt-2 p-2" style={{backgroundColor:'#2c3e50', color:'white', borderRadius:'0.5rem'}}>
                <h6 className="small mb-1">Actividades del Día Seleccionado</h6>
                {currentDayActivities.length > 0 ? currentDayActivities.map((activity, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center small py-1" style={{fontSize:'0.75rem'}}>
                        <span>
                            <CBadge 
                                style={{backgroundColor: activity.color ? getStyle(`--cui-${activity.color}`) : getStyle('--cui-secondary')}} 
                                shape="circle" 
                                className="p-1 me-1"
                            />
                            {activity.title}
                        </span>
                        <span>{activity.time}</span>
                    </div>
                )) : <div className="small text-center py-2 opacity-75">Sin actividades para el día seleccionado.</div>}
                 <CButton color="light" variant="outline" size="sm" className="w-100 mt-2 text-white border-white" style={{fontSize:'0.8rem'}}>
                    <CIcon icon={cilPlus} className="me-1"/> Añadir Item
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Top Clinics, Doctors Schedule, Appointments */}
      <CRow className="g-3 mb-4">
        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><CIcon icon={cilStar} className="me-2 text-danger"/>Top Especialidades (Doctores)</h6>
                {/* <CIcon icon={cilOptions} className="text-muted"/> */}
            </CCardHeader>
            <CCardBody className="d-flex flex-column justify-content-center align-items-center pt-2 pb-3">
              <div style={{width:'180px', height:'180px', position:'relative', margin:'0.5rem 0'}}>
                <CChartDoughnut
                    data={{
                        labels: stats.topClinics?.labels || [],
                        datasets: [{ 
                            data: stats.topClinics?.data || [], 
                            backgroundColor: stats.topClinics?.colors || ['#CCC'], 
                            borderColor:'white', borderWidth:3, hoverBorderWidth:3 
                        }],
                    }}
                    options={{ /* ... */ }}
                />
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <div className="text-muted" style={{fontSize:'0.7rem'}}>Doctores Tot.</div>
                    <div className="fs-5 fw-bold" style={{lineHeight:'1.2'}}>{stats.topClinics?.total || 0}</div>
                </div>
              </div>
              <div className="mt-2 w-100 px-2">
                {(stats.topClinics?.labels || []).map((label, index) => (
                    <div key={label} className="d-flex justify-content-between align-items-center small my-1 py-1">
                        <span><CBadge style={{backgroundColor: stats.topClinics.colors[index]}} shape="circle" className="p-1 me-2"/>{label}</span>
                        <span className="fw-semibold">{stats.topClinics.data[index]}</span>
                    </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Doctors Schedule */}
        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="p-2">
                <CNav variant="pills" role="tablist" fill className="small">
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 1} onClick={() => setActiveDoctorTab(1)} href="#" role="tab">
                            Disponibles <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule?.available?.count || 0}</CBadge>
                        </CNavLink>
                    </CNavItem>
                    {/* Add other tabs if API provides data for them */}
                </CNav>
            </CCardHeader>
            <CCardBody className="p-0" style={{maxHeight: '300px', overflowY: 'auto'}}>
                <CTabContent>
                    <CTabPane role="tabpanel" visible={activeDoctorTab === 1}>
                        <CListGroup flush>
                            {(stats.doctorsSchedule?.available?.list || []).map((doc, index) => (
                                <CListGroupItem key={index} className="d-flex justify-content-between align-items-center px-3 py-2">
                                    <div className="d-flex align-items-center">
                                        <CAvatar 
                                            src={doc.avatar_base64 ? `data:image/jpeg;base64,${doc.avatar_base64}` : '/avatars/placeholder.png'} 
                                            size="md" 
                                            className="me-2"
                                        />
                                        <div>
                                            <div className="fw-semibold small">{doc.name}</div>
                                            <div className="extra-small text-muted">{doc.specialty}</div>
                                        </div>
                                    </div>
                                    <CBadge color="success-light" textColor="success" shape="rounded-pill" className="small">
                                        Disponible
                                    </CBadge>
                                </CListGroupItem>
                            ))}
                            {(stats.doctorsSchedule?.available?.list?.length === 0) &&
                             <CListGroupItem className="text-center text-muted small p-3">No hay doctores disponibles.</CListGroupItem>
                            }
                        </CListGroup>
                    </CTabPane>
                    {/* Add other CTabPanes if needed */}
                </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Appointments Today */}
        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><CIcon icon={cilCalendar} className="me-2 text-success"/>Citas Recientes/Próximas</h6>
                {/* <CIcon icon={cilOptions} className="text-muted"/> */}
            </CCardHeader>
            <CCardBody className="p-0" style={{maxHeight: '300px', overflowY: 'auto'}}>
                <CListGroup flush>
                    {(stats.appointments || []).map((apt, index) => (
                        <CListGroupItem key={apt.id || index} className="d-flex justify-content-between align-items-center px-3 py-2">
                             <div className="d-flex align-items-center">
                                <CAvatar 
                                    src={apt.paciente_foto_base64 ? `data:image/jpeg;base64,${apt.paciente_foto_base64}` : '/avatars/placeholder.png'} 
                                    size="md" 
                                    className="me-2"
                                />
                                <div>
                                    <div className="fw-semibold small">{apt.name}</div>
                                    <div className="extra-small text-muted">Dr/a. {apt.doctor_especialidad}</div>
                                </div>
                            </div>
                            <div className="text-end">
                                <div className="small text-muted">{apt.date}</div>
                                <div className="fw-semibold small">{apt.time}</div>
                            </div>
                        </CListGroupItem>
                    ))}
                     {(stats.appointments?.length === 0) &&
                        <CListGroupItem className="text-center text-muted small p-3">No hay citas programadas.</CListGroupItem>
                     }
                </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Dashboard;