import { useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import type { IncidentEvt } from '../hooks/useIncidents';
import { format } from 'date-fns';

interface IncidentMarkerProps {
  incident: IncidentEvt;
}

// Define icons with different colors based on incident state
const createIcon = (state: string | undefined): Icon => {
  let color = '';
  
  switch (state) {
    case 'travelling':
      color = 'yellow';
      break;
    case 'onsite':
      color = 'blue';
      break;
    case 'finished':
      color = 'green';
      break;
    default:
      color = 'red'; // Default color for unhandled states or undefined
  }

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="36px" height="36px">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>`
    )}`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

/**
 * IncidentMarker component for displaying incidents on the map
 * with appropriate pin color based on state and popup details
 */
const IncidentMarker: React.FC<IncidentMarkerProps> = ({ incident }) => {
  const navigate = useNavigate();
  const icon = createIcon(incident.state);

  // Format date for display in popup
  const formattedDate = incident.createdAt && typeof incident.createdAt === 'string'
    ? format(new Date(incident.createdAt), 'dd/MM/yyyy HH:mm')
    : 'Date inconnue';

  return (
    <Marker 
      position={[incident.lat, incident.lon]} 
      icon={icon}
    >
      <Popup>
        <div className="flex flex-col gap-2">
          <div className="font-semibold">Incident #{incident.id}</div>
          <div className="text-sm">{formattedDate}</div>
          <button 
            className="btn btn-primary mt-2 py-1"
            onClick={() => incident.id && navigate(`/incident/${incident.id}`)}
          >
            Détails
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default IncidentMarker;
