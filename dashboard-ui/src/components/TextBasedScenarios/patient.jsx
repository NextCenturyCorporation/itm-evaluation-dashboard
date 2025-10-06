import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import { FaHeartbeat, FaLungs, FaBrain, FaPercent, FaEye, FaAmbulance, FaChartLine, FaWalking } from 'react-icons/fa';
import { BsPersonFillGear } from 'react-icons/bs';

export const filterLangauge = (str) => {
  if (!str || typeof str !== 'string') return str;

  return str
    .replace(/\bUS\b/g, 'British')
    .replace(/Blackhawk/g, 'helicopter')
    .replace(/\bsquad\b/gi, 'team');
}

const Patient = ({ patient, onImageClick, blockedVitals, imageClickDisabled, hideImages }) => {
  const vitalIcons = {
    avpu: <FaEye size={18} />,
    ambulatory: <FaWalking size={18} />,
    breathing: <FaLungs size={18} />,
    heart_rate: <FaHeartbeat size={18} />,
    spo2: <FaPercent size={18} />,
    mental_status: <FaBrain size={18} />,
    conscious: <BsPersonFillGear size={18} />,
    triss: <FaChartLine size={18} />
  };

  const vitalNames = {
    avpu: "AVPU",
    ambulatory: "Walking",
    breathing: "RR",
    heart_rate: "HR",
    spo2: "SPO2",
    mental_status: "Mental Status",
    conscious: "Conscious",
    triss: "TRISS"
  };

  const getTrissBadgeColor = (score) => {
    if (!score) return 'secondary';
    const value = parseFloat(score);
    if (value >= 90) return 'success';
    if (value >= 75) return 'info';
    if (value >= 50) return 'warning';
    if (value >= 25) return 'orange';
    return 'danger';
  };

  const avpuColors = {
    'ALERT': 'info',
    'VOICE': 'warning',
    'PAIN': 'orange',
    'UNRESPONSIVE': 'danger'
  };

  const breathingColors = {
    'NORMAL': 'info',
    'RESTRICTED': 'orange',
    'FAST': 'warning',
    'SLOW': 'warning',
    'NONE': 'danger'
  };

  const hrColors = {
    'NONE': 'danger',
    'NORMAL': 'info',
    'FAST': 'warning',
    'SLOW': 'warning'
  };

  const spo2Colors = {
    'NORMAL': 'info',
    'LOW': 'warning',
    'NONE': 'danger'
  };

  const mentalColors = {
    'CALM': 'info',
    'AGONY': 'danger',
    'CONFUSED': 'warning',
    'SHOCK': 'orange',
    'UPSET': 'warning',
    'UNRESPONSIVE': 'danger'
  };

  const getVitalBadgeColor = (key, value) => {
    switch (key) {
      case 'avpu':
        return avpuColors[value];
      case 'ambulatory':
        return value ? 'info' : 'warning';
      case 'breathing':
        return breathingColors[value];
      case 'heart_rate':
        return hrColors[value];
      case 'spo2':
        return spo2Colors[value];
      case 'mental_status':
        return mentalColors[value];
      case 'conscious':
        return 'info';
      case 'triss':
        return getTrissBadgeColor(value);
      default:
        return 'secondary';
    }
  };

  const getInjurySeverityColor = (severity) => {
    if (!severity) {
      return 'secondary';
    }

    switch (severity.toLowerCase()) {
      case 'extreme': return 'danger';
      case 'major': return 'orange';
      case 'substantial': return 'warning';
      case 'moderate': return 'info';
      case 'minor': return 'success';
      default: return 'secondary';
    }
  };

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const renderVitals = (vitals) => {
    if (!vitals) {
      return <div>No vitals data available</div>;
    }

    const vitalsVisible = !blockedVitals?.includes(patient.id);

    return (
      <div>
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key} className="vital-item">
            <div className="vital-icon">
              {vitalIcons[key] || key}
            </div>
            <div className="vital-name-and-badge">
              <span className="vital-name">
                {vitalNames[key] || key}
              </span>
              <Badge
                bg={vitalsVisible ? getVitalBadgeColor(key, value) : 'info'}
                className="vital-badge"
              >
                {vitalsVisible ? (key === 'triss' ? `${value}%` : value.toString().toUpperCase()) : "Unknown"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderInjuries = (injuries) => {
    return injuries.map((injury, i) => (
      <div key={i} className="injury-item">
        <div className="injury-name">
          {injury.location !== 'internal' ? capitalizeWords(injury.location) : ''} {injury.name}
        </div>
        <div className="injury-severity">
          <span className="injury-severity-label">Severity:</span>
          <Badge
            bg={getInjurySeverityColor(injury.severity)}
            className="severity-badge"
          >
            {injury.severity.toUpperCase()}
          </Badge>
        </div>
      </div>
    ));
  };

  return (
    <Card className="patient-card-container">
      <Card.Body className="p-0">
        <div className="patient-card-header">
          <h4 className="patient-card-title">{filterLangauge(patient.name)}</h4>
          {patient.demographics.age && (
            <div className="patient-card-subtitle">
              {patient.demographics.age} years old, {patient.demographics.sex === 'F' ? 'Female' : 'Male'}
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="patient-description mb-3">
            {filterLangauge(patient.unstructured)}
          </p>

          {patient.imgUrl && !hideImages &&(
            <Row className="mb-3">
              <Col md={12}>
                <div className="text-white text-center w-100 rounded" style={{ position: 'relative', height: '300px', overflow: 'hidden', backgroundColor: '#fff' }}>
                  <img
                    src={`data:image/png;base64,${patient.imgUrl}`}
                    alt={`${patient.id ?? patient.name}`}
                    style={patient.demographics.age ? {
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      position: 'relative'
                    } : {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                  {!imageClickDisabled && (
                    <ZoomInIcon
                      className="magnifying-glass"
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        zIndex: 1,
                        color: 'white'
                      }}
                      onClick={() => onImageClick(patient)}
                    />
                  )}
                </div>
              </Col>
            </Row>
          )}

          <div className="stats-section">
            <Row>
              <Col md={6}>
                <Card className="stats-card vitals-card">
                  <div className="stats-header">
                    <h5 className="stats-title">Vitals</h5>
                  </div>
                  <div className="stats-content">
                    {renderVitals(patient.vitals)}
                  </div>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="stats-card injuries-card">
                  <div className="stats-header">
                    <h5 className="stats-title">Injuries</h5>
                  </div>
                  <div className="stats-content">
                    {renderInjuries(patient.injuries)}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Patient;