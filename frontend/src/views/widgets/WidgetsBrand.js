import React from 'react'
import PropTypes from 'prop-types'
import { CWidgetStatsD, CRow, CCol } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cibFacebook, cibLinkedin, cibTwitter, cilCalendar } from '@coreui/icons'
import { CChart } from '@coreui/react-chartjs'
import { useNavigate } from 'react-router-dom'

const WidgetsBrand = (props) => {
  const navigate = useNavigate()

  const opcionesGrafico = {
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3,
      },
    },
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  }

  const handleFacebookClick = () => {
    window.open('https://www.facebook.com/H2deMayo/?locale=es_LA', '_blank')
  }

  const handleTwitterClick = () => {
    window.open('https://x.com/i/flow/login?redirect_after_login=%2Fhrsantarosa', '_blank')
  }

  const handleLinkedinClick = () => {
    window.open('https://pe.linkedin.com/company/h2demayo', '_blank')
  }

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      <CCol sm={6} xl={4} xxl={3}>
        <div onClick={handleFacebookClick} style={{ cursor: 'pointer' }}>
          <CWidgetStatsD
            {...(props.withCharts && {
              chart: (
                <CChart
                  className="position-absolute w-100 h-100"
                  type="line"
                  data={{
                    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
                    datasets: [
                      {
                        backgroundColor: 'rgba(255,255,255,.1)',
                        borderColor: 'rgba(255,255,255,.55)',
                        pointHoverBackgroundColor: '#fff',
                        borderWidth: 2,
                        data: [65, 59, 84, 84, 51, 55, 40],
                        fill: true,
                      },
                    ],
                  }}
                  options={opcionesGrafico}
                />
              ),
            })}
            icon={<CIcon icon={cibFacebook} height={52} className="my-4 text-white" />}
            values={[
              { title: 'amigos', value: '89K' },
              { title: 'publicaciones', value: '459' },
            ]}
            style={{
              '--cui-card-cap-bg': '#3b5998',
            }}
          />
        </div>
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <div onClick={handleTwitterClick} style={{ cursor: 'pointer' }}>
          <CWidgetStatsD
            {...(props.withCharts && {
              chart: (
                <CChart
                  className="position-absolute w-100 h-100"
                  type="line"
                  data={{
                    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
                    datasets: [
                      {
                        backgroundColor: 'rgba(255,255,255,.1)',
                        borderColor: 'rgba(255,255,255,.55)',
                        pointHoverBackgroundColor: '#fff',
                        borderWidth: 2,
                        data: [1, 13, 9, 17, 34, 41, 38],
                        fill: true,
                      },
                    ],
                  }}
                  options={opcionesGrafico}
                />
              ),
            })}
            icon={<CIcon icon={cibTwitter} height={52} className="my-4 text-white" />}
            values={[
              { title: 'seguidores', value: '973k' },
              { title: 'tweets', value: '1.792' },
            ]}
            style={{
              '--cui-card-cap-bg': '#00aced',
            }}
          />
        </div>
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <div onClick={handleLinkedinClick} style={{ cursor: 'pointer' }}>
          <CWidgetStatsD
            {...(props.withCharts && {
              chart: (
                <CChart
                  className="position-absolute w-100 h-100"
                  type="line"
                  data={{
                    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
                    datasets: [
                      {
                        backgroundColor: 'rgba(255,255,255,.1)',
                        borderColor: 'rgba(255,255,255,.55)',
                        pointHoverBackgroundColor: '#fff',
                        borderWidth: 2,
                        data: [78, 81, 80, 45, 34, 12, 40],
                        fill: true,
                      },
                    ],
                  }}
                  options={opcionesGrafico}
                />
              ),
            })}
            icon={<CIcon icon={cibLinkedin} height={52} className="my-4 text-white" />}
            values={[
              { title: 'contactos', value: '500' },
              { title: 'publicaciones', value: '1.292' },
            ]}
            style={{
              '--cui-card-cap-bg': '#4875b4',
            }}
          />
        </div>
      </CCol>
      <CCol sm={6} xl={4} xxl={3}>
        <CWidgetStatsD
          color="warning"
          {...(props.withCharts && {
            chart: (
              <CChart
                className="position-absolute w-100 h-100"
                type="line"
                data={{
                  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
                  datasets: [
                    {
                      backgroundColor: 'rgba(255,255,255,.1)',
                      borderColor: 'rgba(255,255,255,.55)',
                      pointHoverBackgroundColor: '#fff',
                      borderWidth: 2,
                      data: [35, 23, 56, 22, 97, 23, 64],
                      fill: true,
                    },
                  ],
                }}
                options={opcionesGrafico}
              />
            ),
          })}
          icon={<CIcon icon={cilCalendar} height={52} className="my-4 text-white" />}
          values={[
            { title: 'eventos', value: '12+' },
            { title: 'reuniones', value: '4' },
          ]}
        />
      </CCol>
    </CRow>
  )
}

WidgetsBrand.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsBrand