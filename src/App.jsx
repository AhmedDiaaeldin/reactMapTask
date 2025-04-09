import React, { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

//not they are [lng, lat] as 
const routePoints = [
  [29.752088166930974, 31.27971701370829],
  [29.752823650636756, 31.280215774153834],
  [29.753512655979556, 31.280537539659115],
  [29.75453673118726, 31.28093976582485],
  [29.755278337490477, 31.28120320714513],
  [29.75517593119831, 31.28197548138341],
  [29.755366779204095, 31.282881831010236],
  [29.754580110695617, 31.284072420460863],
];


// Custom camera icon marker
const cameraMarker = new L.Icon({
  iconUrl: "src/assets/surveilance_11893215.png",
  iconSize: [60,60],
  iconAnchor: [30, 30],
});

// Routing Machine Component
const RoutingMachine = ({ waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: waypoints.map(([lat, lng]) => L.latLng(lat, lng)),
      lineOptions: {
        styles: [{ className: "animate" }],
      },
      routeWhileDragging: true,
      showAlternatives: false,
      createMarker: () => null,
    }).addTo(map);

    // Fit map bounds around the points
    const bounds = L.latLngBounds(waypoints.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [140, 140] }); // 200px padding

    return () => map.removeControl(routingControl);
  }, [map, waypoints]);

  return null;
};

// 3D Model Overlay Component
const ThreeModelOverlay = ({ position }) => {
  const map = useMap();
  const modelRef = useRef();

  useEffect(() => {
    if (!map || !modelRef.current) return;

    const updatePosition = () => {
      const { x, y } = map.latLngToContainerPoint(position);
      modelRef.current.style.transform = `translate(${x - 80}px, ${y - 60}px)`;
    };

    updatePosition();
    map.on("zoomend move", updatePosition);
    return () => map.off("zoomend move", updatePosition);
  }, [map, position]);

  return (
    <div
      ref={modelRef}
      style={{
        position: "absolute",
        width: "10rem",
        height: "10rem",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <ThreeDModel />
      </Canvas>
    </div>
  );
};

const ThreeDModel = () => {
  const { scene } = useGLTF("/scene.gltf");
  return <primitive object={scene} scale={[2, 2, 2]} />;
};

const ControlPanel = ({ markers }) => {
  const videoRef = useRef(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoList = markers.map((_, idx) => `/${idx + 1}.mp4`);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleEnded = () => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoList.length);
    };

    videoEl.addEventListener("ended", handleEnded);
    return () => videoEl.removeEventListener("ended", handleEnded);
  }, [videoList.length]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '300px',
      height: '100vh',
      backgroundColor: 'transparent',
      color: 'white',
      padding: '1rem',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
    }}>
      <img
        src="src/assets/companyLogo.png"
        alt="Surveillance"
        style={{ width: '20%', borderRadius: '10px', marginBottom: '1rem' }}
      />

      <video
        ref={videoRef}
        src={videoList[currentVideoIndex]}
        style={{ width: '100%', borderRadius: '10px', marginBottom: '1rem' }}
        autoPlay
        muted
        controls={false}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {markers.map((_, idx) => (
          <button
            key={idx}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={() => {
              setCurrentVideoIndex(idx);
            }}
          >
            Marker {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};




const MapWithMarkersAndVideo = ({ markers }) => {
  const map = useMap();
  const [videoPositions, setVideoPositions] = useState([]);

  useEffect(() => {
    if (!map) return;

    // Function to convert lat/lng to pixel position
    const updateVideoPositions = () => {
      const positions = markers.map((position) => {
        const point = map.latLngToContainerPoint(position); // Convert lat/lng to pixel
        return { x: point.x, y: point.y };
      });
      setVideoPositions(positions); // Update state with pixel positions
    };

    updateVideoPositions();
    map.on("moveend", updateVideoPositions); 

    return () => map.off("moveend", updateVideoPositions);
  }, [map, markers]);

  return (
    <>
      {markers.map((position, index) => (
        <Marker key={index} position={position} icon={cameraMarker}>
          <div
            style={{
              position: "absolute",
              zIndex: 500,
              width: "25px",
              height: "18px",
              top: videoPositions[index]?.y +3,
              left: videoPositions[index]?.x -12,
            }}
          >
            <video
              style={{ width: "100%", height: "100%" }}
              autoPlay
              muted
              loop
            >
              <source
                src={`/${index + 1}.mp4`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </Marker>
      ))}
    </>
  );
};


// Map Container with Dark Mode and 3D Buildings
const MapWith3DModel = () => {
  const [markersVisible, setMarkersVisible] = useState(true);

  // Disable zoom functionality
  const mapOptions = {
    zoomControl: false, // Disable the zoom control
    scrollWheelZoom: false, // Disable zooming via the mouse scroll wheel
    dragging: true, // Disable dragging on the map (optional)
    touchZoom: false, // Disable touch zooming
    doubleClickZoom: false, // Disable zooming on double-click
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <ControlPanel markers={routePoints} />
      
      <MapContainer
        center={routePoints[0]}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        {...mapOptions}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
  
        <MapWithMarkersAndVideo markers={routePoints} />
        <RoutingMachine waypoints={routePoints} />
      </MapContainer>
    </div>
  );
};

export default MapWith3DModel;
