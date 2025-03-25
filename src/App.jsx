import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine"; // Import Leaflet Routing Machine
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

const position1 = [51.525, -0.19];
const position2 = [51.520, -0.1];

const CustomMarkerIcon = new L.Icon({
  iconUrl: "src/assets/truckStaticShadow.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});


const RoutingMachine = ({ start, end }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start), L.latLng(end)],
      routeWhileDragging: true,
      showAlternatives: false,
      createMarker: () => null, // Hide default route markers
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, start, end]);

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

const MapWith3DModel = () => {
  return (
    <MapContainer center={position1} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position1} icon={CustomMarkerIcon} />
      <RoutingMachine start={position1} end={position2} />
      <ThreeModelOverlay position={position2} />
    </MapContainer>
  );
};

export default MapWith3DModel;
