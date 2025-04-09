import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { FaMapMarkerAlt } from "react-icons/fa";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { MdDeleteSweep } from "react-icons/md";
import { db } from "../Firebase/Firebase";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Отримуємо або генеруємо унікальний deviceId
const deviceId = localStorage.getItem("deviceId") || `device-${Math.random().toString(36).substr(2, 9)}`;
if (!localStorage.getItem("deviceId")) {
  localStorage.setItem("deviceId", deviceId); // Зберігаємо deviceId в localStorage
}

const center = { lat: 49.8397, lng: 24.0297 };

type MarkerType = { id?: string; lat: number; lng: number; timestamp?: Date; deviceId: string };

function MapPage() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyBvSbPw0kTkcLrbl_wWqs8Swdj1xYrFJYc",
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const loadMarkers = async () => {
      // Завантаження маркерів тільки для поточного пристрою
      const querySnapshot = await getDocs(
        collection(db, "markers")
      );
      const loaded: MarkerType[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.deviceId === deviceId) { // Перевірка на відповідність ідентифікатора пристрою
          loaded.push({ id: docSnap.id, lat: data.lat, lng: data.lng, timestamp: data.timestamp, deviceId: data.deviceId });
        }
      });
      setMarkers(loaded);
    };

    loadMarkers();
  }, []);

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!isAdding || !e.latLng) return;

      const newMarker: MarkerType = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        timestamp: new Date(),
        deviceId: deviceId, // Додаємо ідентифікатор пристрою
      };

      try {
        // Збереження маркера з ідентифікатором пристрою
        const docRef = await addDoc(collection(db, "markers"), newMarker);
        setMarkers((current) => [...current, { ...newMarker, id: docRef.id }]);
      } catch (error) {
        console.error("Error adding marker: ", error);
      }
    },
    [isAdding]
  );

  const handleMarkerDragEnd = (index: number, e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if (!latLng) return;

    const updatedMarkers = [...markers];
    updatedMarkers[index] = { lat: latLng.lat(), lng: latLng.lng(), deviceId };
    setMarkers(updatedMarkers);
  };

  const handleMarkerClick = async (index: number) => {
    const marker = markers[index];
    if (!isAdding && marker.id) {
      await deleteDoc(doc(db, "markers", marker.id));
      setMarkers((current) => current.filter((_, i) => i !== index));
    }
  };

  const toggleAddMode = () => setIsAdding((prev) => !prev);

  const handleClearMarkers = async () => {
    for (const marker of markers) {
      if (marker.id) {
        await deleteDoc(doc(db, "markers", marker.id));
      }
    }
    setMarkers([]);
  };

  const handleFocusMarker = (index: number) => {
    const marker = markers[index];
    if (mapRef.current) {
      mapRef.current.panTo(marker);
      mapRef.current.setZoom(15);
    }
  };

  if (!isLoaded) {
    return <div className="text-center mt-20 text-xl">Loading map...</div>;
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100vh" }}
        center={center}
        zoom={13}
        onClick={handleMapClick}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {markers.map((marker, index) => (
          <Marker
            key={marker.id || index}
            position={{ lat: marker.lat, lng: marker.lng }}
            label={(index + 1).toString()}
            draggable={true}
            onClick={() => handleMarkerClick(index)}
            onDragEnd={(e) => handleMarkerDragEnd(index, e)}
            title={`Lat: ${marker.lat.toFixed(5)}, Lng: ${marker.lng.toFixed(5)}`}
          />
        ))}
      </GoogleMap>

      <button
        onClick={toggleAddMode}
        style={{
          position: "absolute",
          bottom: "110px",
          display: "block",
          border: "0px",
          margin: "0px",
          padding: "0px",
          right: "10px",
          width: "40px",
          height: "40px",
          backgroundColor: "#fff",
          borderRadius: "100%",
          fontSize: "16px",
          color: "black",
        }}
        title="Режим додавання маркерів"
      >
        {isAdding ? <FaMapMarkerAlt /> : <HiOutlineLocationMarker />}
      </button>

      <button
        onClick={handleClearMarkers}
        style={{
          position: "absolute",
          bottom: "165px",
          display: "block",
          border: "0px",
          margin: "0px",
          padding: "0px",
          right: "10px",
          width: "40px",
          height: "40px",
          backgroundColor: "#fff",
          borderRadius: "100%",
          fontSize: "16px",
          color: "black",
        }}
        title="Очистити всі маркери"
      >
        <MdDeleteSweep />
      </button>

      <button
        onClick={() => setShowList((prev) => !prev)}
        style={{
          position: "absolute",
          top: "20px",
          display: "block",
          border: "0px",
          margin: "0px",
          padding: "0px",
          left: "10px",
          width: "40px",
          height: "40px",
          backgroundColor: "#fff",
          borderRadius: "100%",
          fontSize: "18px",
          color: "black",
        }}
        title="Список маркерів"
      >
        📍
      </button>

      {showList && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            left: "10px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "10px",
            maxHeight: "200px",
            overflowY: "auto",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            fontSize: "14px",
            width: "160px",
            color: "black",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
            Маркерів: {markers.length}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {markers.map((marker, index) => (
              <li key={index} style={{ marginBottom: "4px" }}>
                <button
                  onClick={() => handleFocusMarker(index)}
                  style={{
                    width: "100%",
                    backgroundColor: "#f0f0f0",
                    border: "none",
                    padding: "5px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "black",
                  }}
                  title={`Lat: ${marker.lat.toFixed(5)}, Lng: ${marker.lng.toFixed(5)}`}
                >
                  Маркер {index + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MapPage;
