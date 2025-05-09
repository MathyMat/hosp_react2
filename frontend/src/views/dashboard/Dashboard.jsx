import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CSpinner,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CAvatar,
  CBadge,
  CButton,
  // CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem, // Not currently used, can be added back if needed
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CListGroup,
  CListGroupItem,
  CProgress,
} from '@coreui/react';
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs';
import CIcon from '@coreui/icons-react';
import { getStyle } from '@coreui/utils';
import {
  cilPeople,
  cilCalendarCheck,
  cilBed,
  cilOptions,
  cilCalendar,
  cilPlus,
  cilChevronLeft,
  cilChevronRight,
  cilBriefcase,
  cilStar,
  cilHospital,
  // cilPen, // Replaced by cilCalendarCheck for appointments
  // cilDoor, // Replaced by cilBed for rooms
  cilChartPie as cilVisitor, // Replaced by cilPeople for patients
  cilMedicalCross
} from '@coreui/icons';
import { API_BASE_URL } from '../../config/apiConfig';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDoctorTab, setActiveDoctorTab] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentDayActivities, setCurrentDayActivities] = useState([]);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/dashboard/stats`);
        setStats(response.data);
        console.log("Dashboard data from API:", response.data);

        // Initialize activities for the current day of the current month
        const today = new Date();
        const initialDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (response.data && response.data.calendarActivities && response.data.calendarActivities[initialDateKey]) {
            setCurrentDayActivities(response.data.calendarActivities[initialDateKey]);
        } else {
            setCurrentDayActivities([]);
        }
        setSelectedCalendarDay(today.getDate()); // Set selected day to today initially

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
    setSelectedCalendarDay(day); // Highlight the clicked day
    const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (stats && stats.calendarActivities && stats.calendarActivities[dateKey]) {
        setCurrentDayActivities(stats.calendarActivities[dateKey]);
    } else {
        setCurrentDayActivities([]);
    }
  };

  const renderCalendarDays = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay(); // 0 = Sunday

    let days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(<CCol key={`empty-${i}`} className="p-1 text-center" style={{minHeight:'40px'}}></CCol>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
        const isSelectedDay = selectedCalendarDay === day;
        const hasActivity = stats && stats.calendarActivities && stats.calendarActivities[dateKey] && stats.calendarActivities[dateKey].length > 0;

      days.push(
        <CCol key={day} className="p-1 text-center">
            <CButton
                color={isSelectedDay ? "primary" : (hasActivity ? "light" : "transparent")}
                className={`w-100 p-1 ${isSelectedDay ? 'text-white' : (hasActivity ? 'fw-bold' : '')} ${isToday && !isSelectedDay ? 'border border-primary' : ''}`}
                variant={isSelectedDay || hasActivity ? undefined : 'ghost'}
                size="sm"
                style={{
                    border: hasActivity && !isSelectedDay ? `1px solid ${getStyle('--cui-primary-border-subtle')}` : undefined, 
                    minHeight:'40px'
                }}
                onClick={() => handleDayClick(day)}
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
        // When month changes, try to select the 1st or current day if it's the current month
        const today = new Date();
        if (newMonthDate.getFullYear() === today.getFullYear() && newMonthDate.getMonth() === today.getMonth()) {
            handleDayClick(today.getDate());
        } else {
            handleDayClick(1); // Select the first day of the new month
        }
        return newMonthDate;
    });
  };
  
  const handleAñadirItemClick = () => {
    navigate('/citas');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <CSpinner color="primary" />
        <span className="ms-3 text-body-secondary">Cargando datos del dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center text-danger">
          <p>Error al cargar los datos:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <p className="text-body-secondary">No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  const SmallLineChart = ({data, borderColor}) => (
    <CChartLine
        style={{ height: '30px', marginTop: '10px' }}
        data={{
            labels: Array((data || []).length).fill(''),
            datasets: [{
                backgroundColor: 'transparent',
                borderColor: borderColor || getStyle('--cui-gray-300'),
                borderWidth: 2,
                data: data || [],
                pointRadius: 0,
                tension: 0.4
            }]
        }}
        options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }}
    />
  );

  const cardStyle = { borderRadius:'1rem', height: '100%' };
  const widgetIconSize = "lg";

  const totalManagedRooms = (stats.roomAvailability?.available || 0) + (stats.roomAvailability?.occupied || 0);
  const totalGeneralRoomsAPI = stats.roomAvailability?.general_total || 0;
  const totalPrivateRoomsAPI = stats.roomAvailability?.private_total || 0;
  
  const occupiedGeneralAPI = stats.roomAvailability?.general_occupied || 0;
  const occupiedPrivateAPI = stats.roomAvailability?.private_occupied || 0;

  const availableGeneralRooms = Math.max(0, totalGeneralRoomsAPI - occupiedGeneralAPI);
  const availablePrivateRooms = Math.max(0, totalPrivateRoomsAPI - occupiedPrivateAPI);


  return (
    <>
      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <CCard style={{ ...cardStyle, backgroundColor: '#4f46e5', color: 'white' }}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CIcon icon={cilHospital} size={widgetIconSize} />
                </div>
                <div style={{fontSize:'0.85rem', opacity:0.9}}>Total Doctores</div>
                <div className="fs-4 fw-bold mt-1">{(stats.totalDoctors?.value || 0)}+</div>
              </div>
              <div>
                <CChartBar
                  style={{ height: '50px', marginTop: '0.5rem' }}
                  data={{
                    labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
                    datasets: [ { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'transparent', borderRadius: 3, data: stats.totalDoctors?.chartData || [], barPercentage: 0.5, categoryPercentage: 0.7 }],
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }}
                />
                <div style={{fontSize:'0.75rem', marginTop:'0.5rem', opacity:0.8}}>Actualmente registrados.</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard style={cardStyle}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CIcon icon={cilCalendarCheck} size={widgetIconSize} className="text-primary"/>
                </div>
                <div style={{fontSize:'0.85rem'}}>Citas Programadas (Hoy)</div>
                <div className="fs-4 fw-bold mt-1">{(stats.bookAppointment?.value || 0).toLocaleString()}</div>
                <div style={{fontSize:'0.75rem', color:'grey', marginTop:'0.1rem'}}>Total para la fecha actual.</div>
              </div>
              <div>
                <SmallLineChart data={stats.bookAppointment?.chartData || []} borderColor={getStyle('--cui-primary')} />
                <div className="text-end" style={{fontSize:'0.75rem', color:'grey', marginTop:'0.2rem'}}>{(stats.bookAppointment?.daily || 0).toLocaleString()} hoy</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

         <CCol sm={6} lg={3}>
            <CCard style={cardStyle}>
                <CCardBody className="p-3 d-flex flex-column justify-content-between">
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <CIcon icon={cilBed} size={widgetIconSize} className="text-warning"/>
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
                            <span className="fw-semibold">{availableGeneralRooms} / {totalGeneralRoomsAPI || 0}</span>
                        </div>
                        <CProgress thin value={(availableGeneralRooms / (totalGeneralRoomsAPI || 1)) * 100} color="secondary" className="mt-1 mb-2"/>
                        <div className="d-flex justify-content-between align-items-center" style={{fontSize:'0.8rem'}}>
                            <span>Privada Disp.</span>
                            <span className="fw-semibold">{availablePrivateRooms} / {totalPrivateRoomsAPI || 0}</span>
                        </div>
                        <CProgress thin value={(availablePrivateRooms / (totalPrivateRoomsAPI || 1)) * 100} color="warning" className="mt-1"/>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard style={cardStyle}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
                <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                    <CIcon icon={cilPeople} size={widgetIconSize} className="text-info"/>
                    </div>
                    <div style={{fontSize:'0.85rem'}}>Total Pacientes Registrados</div>
                    <div className="fs-4 fw-bold mt-1">{(stats.overallVisitor?.value || 0).toLocaleString()}</div>
                    <div style={{fontSize:'0.75rem', color:'grey', marginTop:'0.1rem'}}>Pacientes activos en el sistema.</div>
                </div>
                <div>
                    <SmallLineChart data={stats.overallVisitor?.chartData || []} borderColor={getStyle('--cui-info')} />
                    <div className="text-end" style={{fontSize:'0.75rem', color:'grey', marginTop:'0.2rem'}}>Promedio diario: {(stats.overallVisitor?.daily || 0).toLocaleString()}</div>
                </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={8}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold"><CIcon icon={cilMedicalCross} className="me-2"/>Resumen de Pacientes (Registros Mensuales)</h6>
            </CCardHeader>
            <CCardBody>
                <div className="d-flex justify-content-start small mb-3">
                    {(stats.patientOverview?.datasets || []).map(ds => (
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
                    options={{
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                enabled: true, mode: 'index', intersect: false,
                            }
                        },
                        scales: {
                            x: { grid: { display: false }, stacked: true, ticks:{font:{size:10}} },
                            y: { grid: { color: getStyle('--cui-border-color-translucent') }, stacked: true, ticks: { callback: (value) => Number.isInteger(value) ? value : '', font:{size:10} } }
                        },
                    }}
                />
            </CCardBody>
          </CCard>
        </CCol>

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
                <h6 className="small mb-1">Actividades del Día ({selectedCalendarDay} {currentMonth.toLocaleString('es-ES', { month: 'short' })})</h6>
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
                 <CButton 
                    color="light" 
                    variant="outline" 
                    size="sm" 
                    className="w-100 mt-2 text-white border-white" 
                    style={{fontSize:'0.8rem'}}
                    onClick={handleAñadirItemClick}
                >
                    <CIcon icon={cilPlus} className="me-1"/> Añadir Cita
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><CIcon icon={cilStar} className="me-2 text-danger"/>Top Especialidades (Doctores)</h6>
            </CCardHeader>
            <CCardBody className="d-flex flex-column justify-content-center align-items-center pt-2 pb-3">
              <div style={{width:'180px', height:'180px', position:'relative', margin:'0.5rem 0'}}>
                <CChartDoughnut
                    data={{
                        labels: stats.topClinics?.labels || [],
                        datasets: [{ data: stats.topClinics?.data || [], backgroundColor: stats.topClinics?.colors || ['#CCC', '#DDD', '#EEE'], borderColor:'white', borderWidth:3, hoverBorderWidth:3 }],
                    }}
                    options={{
                        maintainAspectRatio: false, cutout: '75%',
                        plugins: { legend: { display: false }, tooltip:{enabled:true} }
                    }}
                />
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <div className="text-muted" style={{fontSize:'0.7rem'}}>Doctores Tot.</div>
                    <div className="fs-5 fw-bold" style={{lineHeight:'1.2'}}>{stats.topClinics?.total || 0}</div>
                </div>
              </div>
              <div className="mt-2 w-100 px-2">
                {(stats.topClinics?.labels || []).map((label, index) => (
                    <div key={label} className="d-flex justify-content-between align-items-center small my-1 py-1">
                        <span><CBadge style={{backgroundColor: (stats.topClinics?.colors || [])[index] || '#CCC'}} shape="circle" className="p-1 me-2"/>{label}</span>
                        <span className="fw-semibold">{(stats.topClinics?.data || [])[index] || 0}</span>
                    </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="p-2">
                <CNav variant="pills" role="tablist" fill className="small">
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 1} onClick={() => setActiveDoctorTab(1)} href="#" role="tab">Disponibles <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule?.available?.count || 0}</CBadge></CNavLink>
                    </CNavItem>
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 2} onClick={() => setActiveDoctorTab(2)} href="#" role="tab">No Disp. <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule?.unavailable?.count || 0}</CBadge></CNavLink>
                    </CNavItem>
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 3} onClick={() => setActiveDoctorTab(3)} href="#" role="tab">Licencia <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule?.leave?.count || 0}</CBadge></CNavLink>
                    </CNavItem>
                </CNav>
            </CCardHeader>
            <CCardBody className="p-0" style={{maxHeight: '300px', overflowY: 'auto'}}>
                <CTabContent>
                    {[
                        { id: 1, data: stats.doctorsSchedule?.available, statusLabel: "Disponible", statusColor: "success" },
                        { id: 2, data: stats.doctorsSchedule?.unavailable, statusLabel: "No Disponible", statusColor: "danger" },
                        { id: 3, data: stats.doctorsSchedule?.leave, statusLabel: "Licencia", statusColor: "warning" },
                    ].map(tab => (
                        <CTabPane role="tabpanel" key={tab.id} visible={activeDoctorTab === tab.id}>
                            <CListGroup flush>
                                {(tab.data?.list || []).map((doc, index) => (
                                    <CListGroupItem key={index} className="d-flex justify-content-between align-items-center px-3 py-2">
                                        <div className="d-flex align-items-center">
                                            <CAvatar 
                                                src={doc.avatar_base64 ? `data:image/jpeg;base64,${doc.avatar_base64}` : '/avatars/placeholder.png'} 
                                                size="md" 
                                                className="me-2"
                                                onError={(e) => { e.target.onerror = null; e.target.src = '/avatars/placeholder.png'; }}
                                            />
                                            <div>
                                                <div className="fw-semibold small">{doc.name}</div>
                                                <div className="extra-small text-muted">{doc.specialty}</div>
                                            </div>
                                        </div>
                                        <CBadge 
                                            color={`${tab.statusColor}-light`}
                                            textColor={tab.statusColor}
                                            shape="rounded-pill" className="small"
                                        >
                                            {tab.statusLabel}
                                        </CBadge>
                                    </CListGroupItem>
                                ))}
                                {(!tab.data?.list || tab.data.list.length === 0) &&
                                 <CListGroupItem className="text-center text-muted small p-3">No hay doctores en esta categoría.</CListGroupItem>
                                }
                            </CListGroup>
                        </CTabPane>
                    ))}
                </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><CIcon icon={cilCalendar} className="me-2 text-success"/>Citas Recientes/Próximas</h6>
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
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/avatars/placeholder.png'; }}
                                />
                                <div>
                                    <div className="fw-semibold small">{apt.name}</div>
                                    <div className="extra-small text-muted">Dr/a. {apt.doctor_specialty}</div>
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