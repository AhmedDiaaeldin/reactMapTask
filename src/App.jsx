import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

const position1 = [51.505, -0.09]; 
const position2 = [51.500, -0.1]; 
const path = [position1, position2]; // Polyline path

const CustomMarkerIcon = new L.Icon({
  iconUrl: "src/assets/truckStaticShadow.png", // Custom icon URL
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});


const ThreeModelOverlay = ({ position }) => {
  const map = useMap();
  const modelRef = useRef();

  useEffect(() => {
    if (!map || !modelRef.current) return;

    const updatePosition = () => {
      const { x, y } = map.latLngToContainerPoint(position);
      modelRef.current.style.transform = `translate(${x-80}px, ${y-60}px)`;
    };

    // Trigger position update when map loads
    map.whenReady(updatePosition);
    map.on("zoomend move", updatePosition);

    return () => {
      map.off("zoomend move", updatePosition);
    };
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
  return <primitive object={scene} scale={[2, 2, 2]} position={[0, 0, 0]} />;
};


const MapWith3DModel = () => {
  return (
    <MapContainer center={position1} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={path} color="blue" />
      <Marker position={position1} icon={CustomMarkerIcon} />
      <ThreeModelOverlay position={position2} />
    </MapContainer>
  );
};

export default MapWith3DModel;
