import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import { FaHeartbeat, FaLungs, FaBrain, FaPercent, FaEye, FaAmbulance, FaChartLine } from 'react-icons/fa';
import { BsPersonFillGear } from 'react-icons/bs'

const Patient = ({ patient, onImageClick, blockedVitals, imageClickDisabled }) => {
  const vitalIcons = {
    avpu: <FaEye />,
    ambulatory: <FaAmbulance />,
    breathing: <FaLungs />,
    heart_rate: <FaHeartbeat />,
    spo2: <FaPercent />,
    mental_status: <FaBrain />,
    conscious: <BsPersonFillGear />,
    triss: <FaChartLine />
  };

  const vitalNames = {
    avpu: "AVPU",
    ambulatory: "Ambulatory",
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
      <div className="d-flex flex-column gap-1 h-100">
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key} className="vital-item">
            <span className="vital-icon">
              {vitalIcons[key] || key}
            </span>
            <div className="vital-name-and-badge">
              <span className="vital-name">
                {vitalNames[key]}
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
      <div key={i} className="mb-2">
        <strong>{injury.location != 'internal' ? capitalizeWords(injury.location) : ''} {injury.name}</strong>
        <br />
        Severity: <Badge bg={getInjurySeverityColor(injury.severity)}>{injury.severity.toUpperCase()}</Badge>
      </div>
    ));
  };

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <Card.Title className="h4 mb-1">
          {patient.name}
        </Card.Title>
        {patient.demographics.age &&
          <Card.Subtitle className="mb-2 text-muted">
            {patient.demographics.age} years old, {patient.demographics.sex === 'F' ? 'Female' : 'Male'}
          </Card.Subtitle>
        }
        <Card.Text className="mb-3 small">
          {patient.unstructured}
        </Card.Text>
        <Row className="mb-3">
          {patient.imgUrl ? (
            <>
              <Col md={7} className="d-flex mb-3 mb-md-0">
                <div className="bg-primary text-white p-3 text-center d-flex align-items-center justify-content-center w-100 rounded" style={{ position: 'relative', minHeight: '150px', overflow: 'hidden' }}>
                  <img
                    src={`data:image/png;base64,${patient.imgUrl}`}
                    alt={`${patient.id ?? patient.name}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />
                  {!imageClickDisabled &&
                    <ZoomInIcon
                      className="magnifying-glass"
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        zIndex: 1,
                      }}
                      onClick={() => onImageClick(patient)}
                    />
                  }
                </div>
              </Col>
              <Col md={5} className="d-flex flex-column">
                <Card className="w-100 border-0 flex-grow-1 vitals-card" style={{ backgroundColor: '#e7f1ff' }}>
                  <Card.Body className="p-2 d-flex flex-column">
                    <Card.Title className="h5 mb-2 vitals-title">Vitals</Card.Title>
                    <div className="vitals-container flex-grow-1">
                      {renderVitals(patient.vitals)}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </>
          ) : (
            <Col md={12}>
              <Card className="w-100 border-0 h-100 vitals-card" style={{ backgroundColor: '#e7f1ff' }}>
                <Card.Body className="p-3 d-flex flex-column">
                  <Card.Title className="h5 mb-3 vitals-title">Vitals</Card.Title>
                  <div className="vitals-container flex-grow-1">
                    {renderVitals(patient.vitals)}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
        <Card className="mb-0 border-0" style={{ backgroundColor: '#fff0f0' }}>
          <Card.Body className="p-3">
            <Card.Title className="h4 mb-2">Injuries</Card.Title>
            {renderInjuries(patient.injuries)}
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );
};

export default Patient;