import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from './supabase';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');`;

const STATUS_COLORS = {
  available: { bg: "#e6f7ee", text: "#1a7a45", border: "#a3d9b8" },
  pending: { bg: "#fff3e0", text: "#c47f00", border: "#ffd08a" },
  sold: { bg: "#fdecea", text: "#b71c1c", border: "#f5a7a4" },
};

const SAMPLE_PROPERTIES = [
  {
    id: 1,
    name: "Sunridge Estate",
    location: "Sonoma, CA",
    price: 3850000,
    status: "available",
    bedrooms: 5,
    bathrooms: 4.5,
    houseSqft: 4800,
    propertySqft: 43560,
    frontImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    livingRoomImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    lat: 38.292,
    lng: -122.458,
    features: ["Pool", "Jacuzzi"],
    nearestAirport: "STS (Charles M. Schulz–Sonoma County)",
    driveToAirport: "12 min",
    farmersMarket: "Sonoma Plaza Farmers Market",
    touristAttraction: "Sonoma State Historic Park",
    website: "https://example.com/sunridge",
    agent: "Claire Beaumont",
    rating: 5,
    notes: "",
    customFields: {},
  },
  {
    id: 2,
    name: "Coastal Bluff Manor",
    location: "Carmel-by-the-Sea, CA",
    price: 6200000,
    status: "pending",
    bedrooms: 6,
    bathrooms: 5,
    houseSqft: 5600,
    propertySqft: 21780,
    frontImage: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
    livingRoomImage: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
    lat: 36.555,
    lng: -121.923,
    features: ["Pool", "Tennis Court"],
    nearestAirport: "MRY (Monterey Regional)",
    driveToAirport: "18 min",
    farmersMarket: "Carmel Farmers Market",
    touristAttraction: "Point Lobos State Natural Reserve",
    website: "https://example.com/coastalbluff",
    agent: "Marcus Holt",
    rating: 4,
    notes: "",
    customFields: {},
  },
  {
    id: 3,
    name: "Lakewood Retreat",
    location: "Lake Tahoe, CA",
    price: 2475000,
    status: "available",
    bedrooms: 4,
    bathrooms: 3,
    houseSqft: 3200,
    propertySqft: 15246,
    frontImage: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    livingRoomImage: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&q=80",
    lat: 38.943,
    lng: -119.977,
    features: ["Pond", "Jacuzzi"],
    nearestAirport: "RNO (Reno-Tahoe International)",
    driveToAirport: "55 min",
    farmersMarket: "Tahoe City Farmers Market",
    touristAttraction: "Emerald Bay State Park",
    website: "https://example.com/lakewood",
    agent: "Diane Ashworth",
    rating: 4,
    notes: "",
    customFields: {},
  },
  {
    id: 4,
    name: "Vineyard Hill House",
    location: "Napa, CA",
    price: 4100000,
    status: "sold",
    bedrooms: 4,
    bathrooms: 3.5,
    houseSqft: 3900,
    propertySqft: 87120,
    frontImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    livingRoomImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    lat: 38.297,
    lng: -122.286,
    features: ["Pool", "Jacuzzi", "Tennis Court"],
    nearestAirport: "OAK (Oakland International)",
    driveToAirport: "65 min",
    farmersMarket: "Napa Downtown Farmers Market",
    touristAttraction: "Robert Mondavi Winery",
    website: "https://example.com/vineyardhill",
    agent: "Claire Beaumont",
    rating: 3,
    notes: "",
    customFields: {},
  },
];

const fmtPrice = (p) => `$${(p / 1000000).toFixed(2)}M`;
const fmtSqft = (s) => s?.toLocaleString() + " sqft";

const StarRating = ({ rating, onRate, size = 18 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1,2,3,4,5].map(s => (
      <span
        key={s}
        onClick={() => onRate && onRate(s)}
        style={{
          fontSize: size,
          cursor: onRate ? "pointer" : "default",
          color: s <= rating ? "#c9a84c" : "#d0c8b8",
          lineHeight: 1,
          userSelect: "none",
        }}
      >★</span>
    ))}
  </div>
);

const FeatureBadge = ({ label }) => (
  <span style={{
    fontSize: 11,
    background: "#f0ebe0",
    color: "#7a6040",
    border: "0.5px solid #d9cdb0",
    borderRadius: 20,
    padding: "2px 8px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
    whiteSpace: "nowrap",
  }}>{label}</span>
);

const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.available;
  return (
    <span style={{
      fontSize: 11,
      background: c.bg,
      color: c.text,
      border: `0.5px solid ${c.border}`,
      borderRadius: 20,
      padding: "3px 10px",
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      textTransform: "capitalize",
      letterSpacing: "0.02em",
    }}>{status === "pending" ? "Under Offer" : status.charAt(0).toUpperCase() + status.slice(1)}</span>
  );
};

const isPlaceholder = (url) => !url || url.trim() === "";

const PropertyCard = ({ property, onRate, onOpen }) => {
  const [imgTab, setImgTab] = useState("front");
  const [frontLoaded, setFrontLoaded] = useState(false);
  const [livingLoaded, setLivingLoaded] = useState(false);

  const hasFront = !isPlaceholder(property.frontImage);
  const hasLiving = !isPlaceholder(property.livingRoomImage);
  const hasPhotos = (hasFront && frontLoaded) || (hasLiving && livingLoaded);
  const currentLoaded = imgTab === "front" ? frontLoaded : livingLoaded;

  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #e2ddd5",
      borderRadius: 16,
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
      cursor: "pointer",
    }}
    onClick={() => onOpen(property)}
    >
      {/* Always render images but hide container until one loads */}
      {(hasFront || hasLiving) && (
        <div style={{ position: "relative", display: hasPhotos ? "block" : "none" }}>
          <div style={{ position: "relative", paddingTop: "80%", overflow: "hidden", background: "#f5f1ec" }}>
            {hasFront && (
              <img
                src={property.frontImage}
                alt="Front of house"
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  objectFit: "cover",
                  display: imgTab === "front" ? "block" : "none",
                }}
                onLoad={() => setFrontLoaded(true)}
                onError={() => setFrontLoaded(false)}
              />
            )}
            {hasLiving && (
              <img
                src={property.livingRoomImage}
                alt="Living room"
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  objectFit: "cover",
                  display: imgTab === "living" ? "block" : "none",
                }}
                onLoad={() => setLivingLoaded(true)}
                onError={() => setLivingLoaded(false)}
              />
            )}
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4 }}>
              {hasFront && hasLiving && frontLoaded && livingLoaded && ["front", "living"].map(t => (
                <button
                  key={t}
                  onClick={e => { e.stopPropagation(); setImgTab(t); }}
                  style={{
                    fontSize: 10,
                    background: imgTab === t ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.7)",
                    color: imgTab === t ? "#fff" : "#333",
                    border: "none", borderRadius: 12, padding: "3px 8px",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >{t === "front" ? "Exterior" : "Interior"}</button>
              ))}
            </div>
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <StatusBadge status={property.status} />
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22, fontWeight: 600, color: "#2a2420", margin: 0, lineHeight: 1.2,
            }}>{property.name}</h3>
            <p style={{ fontSize: 13, color: "#8a7f74", margin: "3px 0 0", fontWeight: 300 }}>
              📍 {property.location}
            </p>
          </div>
          {!hasPhotos && <StatusBadge status={property.status} />}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          margin: "10px 0",
          borderTop: "0.5px solid #f0ebe0",
          borderBottom: "0.5px solid #f0ebe0",
          padding: "10px 0",
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 24,
            fontWeight: 600,
            color: "#2a2420",
            letterSpacing: "-0.01em",
          }}>{fmtPrice(property.price)}</span>
          <StarRating rating={property.rating} onRate={v => { onRate(property.id, v); }} size={16} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { icon: "🛏", val: property.bedrooms, label: "beds" },
            { icon: "🚿", val: property.bathrooms, label: "baths" },
            { icon: "⬜", val: (property.houseSqft / 1000).toFixed(1) + "k", label: "sqft" },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{
              background: "#faf8f5",
              borderRadius: 8,
              padding: "8px 4px",
              textAlign: "center",
              border: "0.5px solid #ede8e0",
            }}>
              <div style={{ fontSize: 16, lineHeight: 1 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#2a2420", marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 10, color: "#8a7f74" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {property.features.map(f => <FeatureBadge key={f} label={f} />)}
        </div>

        <div style={{ fontSize: 12, color: "#8a7f74", lineHeight: 1.8 }}>
          <div>✈️ {property.nearestAirport} · {property.driveToAirport}</div>
          <div>🌿 {property.farmersMarket}</div>
          <div>🏛 {property.touristAttraction}</div>
          <div style={{ marginTop: 4, color: "#5a7a5a", fontWeight: 500 }}>
            Agent: {property.agent}
          </div>
        </div>
      </div>
    </div>
  );
};

const GMAPS_API_KEY_STORAGE = "estateview_gmaps_key";

const MapView = ({ properties, onSelectProperty }) => {
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem(GMAPS_API_KEY_STORAGE) || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; } catch { return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; }
  });
  const [keyInput, setKeyInput] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);

  const propertiesWithCoords = properties.filter(p => p.lat && p.lng);
  const activeProperty = selectedProperty || propertiesWithCoords[0] || null;

  const saveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    try { localStorage.setItem(GMAPS_API_KEY_STORAGE, k); } catch {}
    setApiKey(k);
  };

  const getEmbedUrl = (p) => {
    if (!p || !apiKey) return "";
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${p.lat},${p.lng}&zoom=13&maptype=roadmap`;
  };

  if (!apiKey) return (
    <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e2ddd5", padding: "48px 32px", textAlign: "center", maxWidth: 460, margin: "0 auto" }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🗺</div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#2a2420", margin: "0 0 10px" }}>Connect Google Maps</h3>
      <p style={{ fontSize: 13, color: "#8a7f74", margin: "0 0 6px", lineHeight: 1.7 }}>
        Paste your Google Maps API key below. Make sure the <strong>Maps Embed API</strong> is enabled in your Google Cloud Console.
      </p>
      <p style={{ fontSize: 12, color: "#b0a48e", margin: "0 0 20px", lineHeight: 1.6 }}>
        Your key is saved in this browser only and never sent anywhere except Google.
      </p>
      <input
        value={keyInput}
        onChange={e => setKeyInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && saveKey()}
        placeholder="AIzaSy..."
        style={{ width: "100%", border: "0.5px solid #e2ddd5", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#faf8f5", color: "#2a2420", boxSizing: "border-box", outline: "none", marginBottom: 10 }}
      />
      <button onClick={saveKey} style={{ width: "100%", background: "#2a2420", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Load Map</button>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>

      {/* Property list sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 580, overflowY: "auto" }}>
        {propertiesWithCoords.length === 0 && (
          <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e2ddd5", padding: 20, textAlign: "center", color: "#8a7f74", fontSize: 13 }}>
            No properties have coordinates yet. Add listings to see them here.
          </div>
        )}
        {propertiesWithCoords.map(p => {
          const isActive = activeProperty?.id === p.id;
          const statusColors = { available: "#1a7a45", pending: "#c47f00", sold: "#b71c1c" };
          return (
            <div
              key={p.id}
              onClick={() => setSelectedProperty(p)}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: isActive ? "2px solid #2a2420" : "0.5px solid #e2ddd5",
                padding: "12px 14px",
                cursor: "pointer",
                transition: "border 0.15s",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {!isPlaceholder(p.frontImage) && (
                  <img src={p.frontImage} alt={p.name} style={{ width: 52, height: 42, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: 600, color: "#2a2420", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#8a7f74", marginTop: 1 }}>{p.location}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 600, color: "#2a2420" }}>{fmtPrice(p.price)}</span>
                    <span style={{ fontSize: 10, background: isActive ? "#2a2420" : "#f5f1eb", color: isActive ? "#fff" : statusColors[p.status], borderRadius: 20, padding: "2px 7px", fontWeight: 500 }}>
                      {p.status === "pending" ? "Under Offer" : p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              {isActive && (
                <button
                  onClick={e => { e.stopPropagation(); onSelectProperty(p); }}
                  style={{ marginTop: 8, width: "100%", background: "#2a2420", color: "#fff", border: "none", borderRadius: 7, padding: "6px 0", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >View Full Details →</button>
              )}
            </div>
          );
        })}

        {/* Change key */}
        <button
          onClick={() => { setApiKey(""); try { localStorage.removeItem(GMAPS_API_KEY_STORAGE); } catch {} }}
          style={{ background: "transparent", color: "#b0a48e", border: "none", fontSize: 11, cursor: "pointer", padding: "4px 0", fontFamily: "'DM Sans', sans-serif" }}
        >Change API key</button>
      </div>

      {/* Map iframe */}
      <div style={{ borderRadius: 16, overflow: "hidden", border: "0.5px solid #e2ddd5", position: "relative" }}>
        {activeProperty
          ? <iframe
              key={activeProperty.id}
              src={getEmbedUrl(activeProperty)}
              width="100%"
              height="580"
              style={{ border: "none", display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          : <div style={{ height: 580, background: "#f7f3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7f74", fontSize: 14 }}>
              Select a property to view on map
            </div>
        }
        {activeProperty && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(42,36,32,0.75))", padding: "24px 16px 14px" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#fff" }}>{activeProperty.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>📍 {activeProperty.location} · ✈️ {activeProperty.nearestAirport} · {activeProperty.driveToAirport}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailModal = ({ property, onClose, onRate, onUpdatePhotos, onUpdateNotes, onUpdateDetails, onArchive }) => {
  const [editingPhotos, setEditingPhotos] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [draft, setDraft] = useState({});
  const [pendingFront, setPendingFront] = useState(null);
  const [pendingLiving, setPendingLiving] = useState(null);
  const [frontPasteUrl, setFrontPasteUrl] = useState("");
  const [livingPasteUrl, setLivingPasteUrl] = useState("");
  const modalRef = useRef(null);

  if (!property) return null;

  const openEditor = () => {
    setPendingFront(null);
    setPendingLiving(null);
    setFrontPasteUrl("");
    setLivingPasteUrl("");
    setEditingPhotos(true);
    setEditingDetails(false);
  };

  const openDetailsEditor = () => {
    setDraft({
      name: property.name,
      location: property.location,
      price: property.price,
      status: property.status,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      houseSqft: property.houseSqft,
      propertySqft: property.propertySqft,
      agent: property.agent,
      nearestAirport: property.nearestAirport,
      driveToAirport: property.driveToAirport,
      farmersMarket: property.farmersMarket,
      touristAttraction: property.touristAttraction,
      website: property.website,
      features: (property.features || []).join(", "),
    });
    setEditingDetails(true);
    setEditingPhotos(false);
    if (modalRef.current) modalRef.current.scrollTop = 0;
  };

  const saveDetails = () => {
    onUpdateDetails(property.id, {
      ...draft,
      price: parseFloat(String(draft.price).replace(/[^0-9.]/g, "")) || 0,
      bedrooms: parseFloat(draft.bedrooms) || 0,
      bathrooms: parseFloat(draft.bathrooms) || 0,
      houseSqft: parseFloat(String(draft.houseSqft).replace(/[^0-9.]/g, "")) || 0,
      propertySqft: parseFloat(String(draft.propertySqft).replace(/[^0-9.]/g, "")) || 0,
      features: draft.features ? draft.features.split(",").map(f => f.trim()).filter(Boolean) : [],
    });
    setEditingDetails(false);
  };

  const Field = ({ label, field, type = "text", options }) => (
    <div>
      <div style={{ fontSize: 11, color: "#8a7f74", marginBottom: 4 }}>{label}</div>
      {options
        ? <select
            value={draft[field] || ""}
            onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
            style={{ width: "100%", border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#2a2420", outline: "none", boxSizing: "border-box" }}
          >
            {options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        : <input
            type={type}
            value={draft[field] ?? ""}
            onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
            style={{ width: "100%", border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#2a2420", outline: "none", boxSizing: "border-box" }}
          />
      }
    </div>
  );

  const pickFile = (which) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (which === "front") setPendingFront({ url: dataUrl, name: file.name });
        else setPendingLiving({ url: dataUrl, name: file.name });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const savePhotos = async () => {
    let newFront = frontPasteUrl.trim() || property.frontImage;
    let newLiving = livingPasteUrl.trim() || property.livingRoomImage;

    if (pendingFront?.url?.startsWith('data:')) {
      const url = await uploadPhoto(property.id, 'front', pendingFront.url);
      if (url) newFront = url;
    } else if (pendingFront?.url) {
      newFront = pendingFront.url;
    }

    if (pendingLiving?.url?.startsWith('data:')) {
      const url = await uploadPhoto(property.id, 'living', pendingLiving.url);
      if (url) newLiving = url;
    } else if (pendingLiving?.url) {
      newLiving = pendingLiving.url;
    }

    onUpdatePhotos(property.id, newFront, newLiving);
    setEditingPhotos(false);
    if (modalRef.current) modalRef.current.scrollTop = 0;
  };

  const SlotPreview = ({ label, pending, pasteUrl, which }) => {
    const current = pasteUrl.trim() || pending?.url;
    return (
      <div>
        <div style={{ fontSize: 11, color: "#8a7f74", marginBottom: 6 }}>{label}</div>
        <div style={{
          height: 120, borderRadius: 10, overflow: "hidden", marginBottom: 8,
          border: current ? "2px solid #a3d9b8" : "1.5px dashed #d9cdb0",
          background: current ? "transparent" : "#f5f1eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          {current
            ? <img src={current} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ textAlign: "center", color: "#b0a48e", fontSize: 12 }}>No photo selected</div>
          }
          {pending && <div style={{ position: "absolute", top: 6, right: 6, background: "#1a7a45", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>✓ {pending.name}</div>}
        </div>
        <button onClick={() => pickFile(which)} style={{ width: "100%", background: "#f5f1eb", color: "#2a2420", border: "0.5px solid #d9cdb0", borderRadius: 8, padding: "8px 0", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
          📁 Choose from computer
        </button>
        <input
          value={pasteUrl}
          onChange={e => which === "front" ? setFrontPasteUrl(e.target.value) : setLivingPasteUrl(e.target.value)}
          placeholder="Or paste image URL…"
          style={{ width: "100%", border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#2a2420", boxSizing: "border-box", outline: "none" }}
        />
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(30,25,20,0.6)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 20,
          maxWidth: 720,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Photos */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ position: "relative" }}>
              <img src={property.frontImage} alt="Exterior" style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: "20px 0 0 0", display: "block" }} />
              <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 11, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>Exterior</div>
            </div>
            <div style={{ position: "relative" }}>
              <img src={property.livingRoomImage} alt="Interior" style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: "0 20px 0 0", display: "block" }} />
              <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 11, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>Interior</div>
            </div>
          </div>
          <button
            onClick={() => editingPhotos ? setEditingPhotos(false) : openEditor()}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "rgba(255,255,255,0.92)", color: "#2a2420",
              border: "0.5px solid #e2ddd5", borderRadius: 20,
              padding: "5px 12px", fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}
          >📷 Edit Photos</button>
          <button
            onClick={() => editingDetails ? setEditingDetails(false) : openDetailsEditor()}
            style={{
              position: "absolute", top: 10, right: 130,
              background: "rgba(255,255,255,0.92)", color: "#2a2420",
              border: "0.5px solid #e2ddd5", borderRadius: 20,
              padding: "5px 12px", fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            }}
          >✏️ Edit Details</button>
        </div>

        {/* Photo editor panel */}
        {editingPhotos && (
          <div style={{ background: "#faf8f5", borderBottom: "0.5px solid #e2ddd5", padding: "18px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
              <SlotPreview label="EXTERIOR PHOTO" pending={pendingFront} pasteUrl={frontPasteUrl} which="front" />
              <SlotPreview label="INTERIOR PHOTO" pending={pendingLiving} pasteUrl={livingPasteUrl} which="living" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={savePhotos}
                style={{
                  background: "#2a2420", color: "#fff", border: "none",
                  borderRadius: 8, padding: "8px 20px", fontSize: 13,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                }}
              >Save Photos</button>
              <button
                onClick={() => setEditingPhotos(false)}
                style={{
                  background: "#fff", color: "#2a2420", border: "0.5px solid #e2ddd5",
                  borderRadius: 8, padding: "8px 14px", fontSize: 13,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* Details editor panel */}
        {editingDetails && (
          <div style={{ background: "#faf8f5", borderBottom: "0.5px solid #e2ddd5", padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="PROPERTY NAME" field="name" />
              <Field label="LOCATION" field="location" />
              <Field label="PRICE (USD)" field="price" type="number" />
              <Field label="STATUS" field="status" options={["available", "pending", "sold"]} />
              <Field label="BEDROOMS" field="bedrooms" type="number" />
              <Field label="BATHROOMS" field="bathrooms" type="number" />
              <Field label="HOUSE SIZE (sqft)" field="houseSqft" type="number" />
              <Field label="PROPERTY SIZE (sqft)" field="propertySqft" type="number" />
              <Field label="AGENT" field="agent" />
              <Field label="WEBSITE URL" field="website" />
              <Field label="NEAREST AIRPORT" field="nearestAirport" />
              <Field label="DRIVE TO AIRPORT" field="driveToAirport" />
              <Field label="FARMERS MARKET" field="farmersMarket" />
              <Field label="TOURIST ATTRACTION" field="touristAttraction" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Field label='FEATURES (comma-separated, e.g. "Pool, Jacuzzi, Tennis Court")' field="features" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveDetails} style={{ background: "#2a2420", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Save Details</button>
              <button onClick={() => setEditingDetails(false)} style={{ background: "#fff", color: "#2a2420", border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
            </div>
          </div>
        )}
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: "#2a2420", margin: 0 }}>{property.name}</h2>
              <p style={{ color: "#8a7f74", margin: "4px 0 0", fontSize: 14 }}>{property.location}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#2a2420" }}>{fmtPrice(property.price)}</div>
              <StatusBadge status={property.status} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
            {[
              { label: "Bedrooms", val: property.bedrooms },
              { label: "Bathrooms", val: property.bathrooms },
              { label: "House", val: fmtSqft(property.houseSqft) },
              { label: "Property", val: fmtSqft(property.propertySqft) },
              { label: "Agent", val: property.agent },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: "#faf8f5", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "0.5px solid #ede8e0" }}>
                <div style={{ fontSize: 11, color: "#8a7f74", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#2a2420" }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {property.features.map(f => <FeatureBadge key={f} label={f} />)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, fontSize: 13 }}>
            <div style={{ background: "#faf8f5", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ede8e0" }}>
              <div style={{ color: "#8a7f74", fontSize: 11, marginBottom: 4 }}>NEAREST AIRPORT</div>
              <div style={{ color: "#2a2420", fontWeight: 500 }}>{property.nearestAirport}</div>
              <div style={{ color: "#8a7f74" }}>{property.driveToAirport} drive</div>
            </div>
            <div style={{ background: "#faf8f5", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ede8e0" }}>
              <div style={{ color: "#8a7f74", fontSize: 11, marginBottom: 4 }}>FARMERS MARKET</div>
              <div style={{ color: "#2a2420", fontWeight: 500 }}>{property.farmersMarket}</div>
            </div>
            <div style={{ background: "#faf8f5", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ede8e0" }}>
              <div style={{ color: "#8a7f74", fontSize: 11, marginBottom: 4 }}>NEARBY ATTRACTION</div>
              <div style={{ color: "#2a2420", fontWeight: 500 }}>{property.touristAttraction}</div>
            </div>
            <div style={{ background: "#faf8f5", borderRadius: 10, padding: "12px 14px", border: "0.5px solid #ede8e0" }}>
              <div style={{ color: "#8a7f74", fontSize: 11, marginBottom: 6 }}>YOUR RATING</div>
              <StarRating rating={property.rating} onRate={v => onRate(property.id, v)} size={20} />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#8a7f74", fontSize: 11, marginBottom: 6, letterSpacing: "0.04em" }}>YOUR NOTES</div>
            <textarea
              value={property.notes || ""}
              onChange={e => onUpdateNotes(property.id, e.target.value)}
              placeholder="Add your thoughts about this property…"
              rows={3}
              style={{
                width: "100%", border: "0.5px solid #e2ddd5", borderRadius: 10,
                padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                color: "#2a2420", background: "#faf8f5", resize: "vertical",
                outline: "none", boxSizing: "border-box", lineHeight: 1.6,
              }}
            />
          </div>

          {Object.keys(property.customFields || {}).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#8a7f74", fontSize: 11, marginBottom: 8, letterSpacing: "0.05em" }}>ADDITIONAL DETAILS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                {Object.entries(property.customFields).map(([k, v]) => (
                  <div key={k} style={{ background: "#faf8f5", borderRadius: 8, padding: "8px 12px", border: "0.5px solid #ede8e0" }}>
                    <span style={{ color: "#8a7f74" }}>{k}: </span>
                    <span style={{ color: "#2a2420", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {property.website && (
              <a
                href={property.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, textAlign: "center",
                  background: "#2a2420", color: "#fff",
                  padding: "11px 0", borderRadius: 10,
                  textDecoration: "none", fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onClick={e => e.stopPropagation()}
              >View Listing ↗</a>
            )}
            <button
              onClick={() => onArchive(property.id)}
              style={{
                flex: 1, background: "#fff8f0", color: "#c47f00",
                border: "0.5px solid #ffd08a", borderRadius: 10,
                padding: "11px 0", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >Archive</button>
            <button
              onClick={onClose}
              style={{
                flex: 1, background: "#faf8f5", color: "#2a2420",
                border: "0.5px solid #e2ddd5", borderRadius: 10,
                padding: "11px 0", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SORT_OPTIONS = [
  { value: "recent_desc", label: "Most Recently Added" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating_desc", label: "Rating: Best First" },
  { value: "sqft_desc", label: "House Size: Largest" },
  { value: "sqft_asc", label: "House Size: Smallest" },
  { value: "name_asc", label: "Name A–Z" },
];

const ALL_COLUMNS = ["Price", "Location", "Agent", "Beds", "Baths", "House sqft", "Property sqft", "Status", "Rating", "Airport", "Market"];

const uploadViaAI = async (input, isText = false) => {
  const prompt = isText
    ? `You are a real estate data extraction specialist. Extract data from the listing text below and return ONLY a valid JSON object.

CRITICAL EXTRACTION RULES:
- price: Extract the numeric price (integer, no currency symbols). European listings often show prices like "1 250 000 €" or "1.250.000 €" — strip spaces/dots/commas and convert to integer. If price is in euros, convert to USD at 1.08 rate. Never return 0 if a price is visible.
- houseSqft: Look for living area / surface habitable / Wohnfläche / superficie. If in sq meters, multiply by 10.764. Never return 0 if a size is mentioned.
- propertySqft: Look for land/plot/terrain/garden area. If in sq meters or hectares (1 hectare = 107,639 sqft), convert. Never return 0 if mentioned.
- bathrooms: Look for "salle de bain", "salle d'eau", "WC", "bathroom", "shower room" — count all wet rooms. Return at least 1 if it's a habitable property.
- features: Look for pool/piscine, jacuzzi/spa/hot tub, tennis, pond/étang, barn/grange, chapel/chapelle, tower/tour, guest house — include anything distinctive.
- status: "available", "pending", or "sold". Default to "available".

Listing text:
${input}

Return this exact JSON (no markdown, no explanation, just JSON):
{
  "name": "property name or address",
  "location": "closest town, country",
  "price": 1234567,
  "status": "available",
  "bedrooms": 4,
  "bathrooms": 3.5,
  "houseSqft": 3200,
  "propertySqft": 43560,
  "features": ["Pool","Jacuzzi","Tennis Court","Pond"],
  "nearestAirport": "Airport code and full name",
  "driveToAirport": "XX min",
  "farmersMarket": "Name of nearest year-round farmers market",
  "touristAttraction": "Nearest notable tourist attraction",
  "agent": "Agent name if mentioned, else Unknown",
  "website": "",
  "lat": 48.8566,
  "lng": 2.3522
}`
    : `You are a real estate data extraction specialist. From the listing URL below, infer as much as you can from the URL slug, domain, and your knowledge of the region.

CRITICAL RULES:
- Extract location from the URL path (e.g. "angers", "sarlat-la-caneda", "dordogne" etc.)
- Use your knowledge of French/European property markets for price ranges for the property type
- For European properties convert sq meters to sqft (1 sqm = 10.764 sqft)
- Use your knowledge of the region for nearest airport, farmers market, tourist attraction
- Never return 0 for price if you can infer a reasonable range from property type and location
- status should be "available" unless URL suggests otherwise

URL: ${input}

Return this exact JSON (no markdown, no explanation, just JSON):
{
  "name": "Property name inferred from URL",
  "location": "Closest town, Country",
  "price": 0,
  "status": "available",
  "bedrooms": 0,
  "bathrooms": 0,
  "houseSqft": 0,
  "propertySqft": 0,
  "features": [],
  "nearestAirport": "Nearest airport code and name",
  "driveToAirport": "Estimated drive time",
  "farmersMarket": "Nearest town with a year-round farmers market",
  "touristAttraction": "Most notable nearby attraction",
  "agent": "Unknown",
  "website": "${input}",
  "lat": 0,
  "lng": 0
}`;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const rawText = data.content?.find(b => b.type === "text")?.text || "";
  if (!rawText) throw new Error("Empty response from AI");
  // Extract JSON from anywhere in the response (handles leading/trailing text)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`No JSON found in response: ${rawText.slice(0, 100)}`);
  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
};

const suggestViaAI = async (topProperties) => {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Based on these top-rated properties, suggest 3 similar properties the buyer might love. Return ONLY a JSON array of 3 objects with this structure:
[{"name": "...", "location": "...", "price": 1234567, "why": "1-sentence reason", "features": ["Pool"], "bedrooms": 4, "bathrooms": 3}]

Top rated properties:
${JSON.stringify(topProperties.map(p => ({ name: p.name, location: p.location, price: p.price, features: p.features, bedrooms: p.bedrooms, bathrooms: p.bathrooms })))}

Return only valid JSON array, no markdown.`
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.find(b => b.type === "text")?.text || "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
};

// ── Supabase helpers ─────────────────────────────────────────────
const upsertProperty = async (property, archived = false) => {
  const { id, ...data } = property;
  await supabase.from('properties').upsert({ id, data, archived });
};

const deletePropertyFromDB = async (id) => {
  await supabase.from('properties').delete().eq('id', id);
};

const dataURLtoBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
};

const uploadPhoto = async (propertyId, slot, dataUrl) => {
  const ext = dataUrl.split(';')[0].split('/')[1] || 'jpg';
  const path = `${propertyId}/${slot}-${Date.now()}.${ext}`;
  const blob = dataURLtoBlob(dataUrl);
  const { error } = await supabase.storage.from('property-photos').upload(path, blob, { upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from('property-photos').getPublicUrl(path);
  return data.publicUrl;
};
// ─────────────────────────────────────────────────────────────────

export default function PropertyApp() {
  const [properties, setProperties] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("cards");
  const [sort, setSort] = useState("recent_desc");
  const [selectedColumns, setSelectedColumns] = useState(["Price", "Location", "Agent", "Beds", "Baths", "Status", "Rating"]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [detailProperty, setDetailProperty] = useState(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [customFieldKey, setCustomFieldKey] = useState("");
  const [customFieldVal, setCustomFieldVal] = useState("");
  const [customFieldTarget, setCustomFieldTarget] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    supabase.from('properties').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('Supabase load error:', error); setLoading(false); return; }
        if (data && data.length > 0) {
          setProperties(data.filter(r => !r.archived).map(r => ({ id: r.id, ...r.data })));
          setArchived(data.filter(r => r.archived).map(r => ({ id: r.id, ...r.data })));
          setLoading(false);
        } else {
          // Seed sample properties on first run
          const seeds = SAMPLE_PROPERTIES.map(({ id, ...data }) => ({ id, data, archived: false }));
          supabase.from('properties').insert(seeds).then(() => {
            setProperties(SAMPLE_PROPERTIES);
            setLoading(false);
          });
        }
      })
      .catch(err => { console.error('Supabase error:', err); setLoading(false); });
  }, []);

  const sorted = useMemo(() => {
    let list = [...properties];
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    const [key, dir] = sort.split("_");
    list.sort((a, b) => {
      let va, vb;
      if (key === "recent") { return dir === "desc" ? b.id - a.id : a.id - b.id; }
      else if (key === "price") { va = a.price; vb = b.price; }
      else if (key === "rating") { va = a.rating; vb = b.rating; }
      else if (key === "sqft") { va = a.houseSqft; vb = b.houseSqft; }
      else if (key === "name") { return a.name.localeCompare(b.name) * (dir === "asc" ? 1 : -1); }
      else return 0;
      return dir === "asc" ? va - vb : vb - va;
    });
    return list;
  }, [properties, sort, filterStatus]);

  const handleRate = (id, rating) => {
    setProperties(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, rating } : p);
      const prop = updated.find(p => p.id === id);
      if (prop) upsertProperty(prop);
      return updated;
    });
    if (detailProperty?.id === id) setDetailProperty(prev => ({ ...prev, rating }));
  };

  const handleUpdateNotes = (id, notes) => {
    setProperties(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, notes } : p);
      const prop = updated.find(p => p.id === id);
      if (prop) upsertProperty(prop);
      return updated;
    });
    if (detailProperty?.id === id) setDetailProperty(prev => ({ ...prev, notes }));
  };

  const handleUpdateDetails = (id, updates) => {
    setProperties(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      const prop = updated.find(p => p.id === id);
      if (prop) upsertProperty(prop);
      return updated;
    });
    setDetailProperty(prev => prev ? { ...prev, ...updates } : prev);
  };

  const handleArchive = (id) => {
    const prop = properties.find(p => p.id === id);
    if (!prop) return;
    setArchived(prev => [prop, ...prev]);
    setProperties(prev => prev.filter(p => p.id !== id));
    setDetailProperty(null);
    upsertProperty(prop, true);
  };

  const handleRestore = (id) => {
    const prop = archived.find(p => p.id === id);
    if (!prop) return;
    setProperties(prev => [prop, ...prev]);
    setArchived(prev => prev.filter(p => p.id !== id));
    upsertProperty(prop, false);
  };

  const handleDeletePermanent = (id) => {
    setArchived(prev => prev.filter(p => p.id !== id));
    deletePropertyFromDB(id);
  };

  const handleUpdatePhotos = (id, frontImage, livingRoomImage) => {
    setProperties(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, frontImage, livingRoomImage } : p);
      const prop = updated.find(p => p.id === id);
      if (prop) upsertProperty(prop);
      return updated;
    });
    setDetailProperty(prev => prev ? { ...prev, frontImage, livingRoomImage } : prev);
  };

  const doUpload = async (input, isText = false) => {
    setUploading(true);
    setUploadError("");
    try {
      const data = await uploadViaAI(input, isText);
      const newProp = {
        id: Date.now(),
        name: data.name || "New Listing",
        location: data.location || "Unknown",
        price: data.price || 0,
        status: data.status || "available",
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        houseSqft: data.houseSqft || 0,
        propertySqft: data.propertySqft || 0,
        frontImage: "",
        livingRoomImage: "",
        lat: data.lat || 0,
        lng: data.lng || 0,
        features: data.features || [],
        nearestAirport: data.nearestAirport || "TBD",
        driveToAirport: data.driveToAirport || "TBD",
        farmersMarket: data.farmersMarket || "TBD",
        touristAttraction: data.touristAttraction || "TBD",
        website: isText ? "" : input,
        agent: data.agent || "Unknown",
        rating: 0,
        notes: "",
        customFields: {},
      };
      setProperties(prev => [newProp, ...prev]);
      upsertProperty(newProp);
      setUploadUrl("");
      setPasteText("");
      setShowPasteModal(false);
      setView("cards");
      setSort("recent_desc");
    } catch (e) {
      setUploadError("Extraction failed: " + (e.message || "Unknown error") + ". Try selecting more text from the listing page.");
    }
    setUploading(false);
  };

  const handleUpload = () => {
    if (!uploadUrl.trim()) return;
    doUpload(uploadUrl, false);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    doUpload(pasteText, true);
  };

  const handleSuggest = async () => {
    setLoadingSuggestions(true);
    const top = [...properties].sort((a, b) => b.rating - a.rating).slice(0, 3);
    try {
      const results = await suggestViaAI(top);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const addCustomField = () => {
    if (!customFieldKey || !customFieldTarget) return;
    setProperties(prev => prev.map(p =>
      p.id.toString() === customFieldTarget
        ? { ...p, customFields: { ...p.customFields, [customFieldKey]: customFieldVal } }
        : p
    ));
    setCustomFieldKey("");
    setCustomFieldVal("");
    setCustomFieldTarget("");
    setShowAddField(false);
  };

  const colVal = (p, col) => {
    switch (col) {
      case "Price": return fmtPrice(p.price);
      case "Location": return p.location;
      case "Agent": return p.agent;
      case "Beds": return p.bedrooms;
      case "Baths": return p.bathrooms;
      case "House sqft": return p.houseSqft?.toLocaleString();
      case "Property sqft": return p.propertySqft?.toLocaleString();
      case "Status": return <StatusBadge status={p.status} />;
      case "Rating": return <StarRating rating={p.rating} onRate={v => handleRate(p.id, v)} size={13} />;
      case "Airport": return p.nearestAirport;
      case "Market": return p.farmersMarket;
      default: return p.customFields?.[col] || "—";
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f7f3ef", fontFamily: "'DM Sans', sans-serif", color: "#8a7f74", fontSize: 14 }}>
      Loading properties…
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f7f3ef", minHeight: "100vh" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{
        background: "#2a2420",
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30,
            fontWeight: 300,
            color: "#f5efe8",
            margin: 0,
            letterSpacing: "0.04em",
          }}>Estate<span style={{ fontStyle: "italic", color: "#c9a84c" }}>View</span></h1>
          <p style={{ color: "#8a7f74", fontSize: 12, margin: "2px 0 0", letterSpacing: "0.06em" }}>
            {properties.length} PROPERTIES{archived.length > 0 ? ` · ${archived.length} ARCHIVED` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["cards", "list", "gallery", "map", "suggest", "archive"].map(v => (
            <button
              key={v}
              onClick={() => { setView(v); if (v === "suggest") handleSuggest(); }}
              style={{
                background: view === v ? "#c9a84c" : "rgba(255,255,255,0.08)",
                color: view === v ? "#2a2420" : v === "archive" ? "#a89070" : "#c4bdb4",
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: view === v ? 500 : 400,
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {v === "cards" ? "🃏 Cards" : v === "list" ? "📋 List" : v === "gallery" ? "🖼 Gallery" : v === "map" ? "🗺 Map" : v === "suggest" ? "✨ Suggest" : `📦 Archive${archived.length > 0 ? ` (${archived.length})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: "#fff",
        borderBottom: "0.5px solid #e2ddd5",
        padding: "12px 32px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{
            border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "6px 10px",
            fontSize: 13, background: "#faf8f5", color: "#2a2420",
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "6px 10px",
            fontSize: 13, background: "#faf8f5", color: "#2a2420",
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="pending">Under Offer</option>
          <option value="sold">Sold</option>
        </select>

        {view === "list" && (
          <button
            onClick={() => setShowColumnPicker(v => !v)}
            style={{
              border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "6px 12px",
              fontSize: 13, background: "#faf8f5", color: "#2a2420",
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            }}
          >⚙️ Columns</button>
        )}

        <button
          onClick={() => setShowAddField(v => !v)}
          style={{
            border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "6px 12px",
            fontSize: 13, background: "#faf8f5", color: "#2a2420",
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            marginLeft: "auto",
          }}
        >+ Custom Field</button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={uploadUrl}
            onChange={e => setUploadUrl(e.target.value)}
            placeholder="Paste listing URL…"
            style={{
              border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "6px 12px",
              fontSize: 13, background: "#faf8f5", color: "#2a2420",
              fontFamily: "'DM Sans', sans-serif", width: 220,
              outline: "none",
            }}
            onKeyDown={e => e.key === "Enter" && handleUpload()}
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              background: "#2a2420", color: "#f5efe8",
              border: "none", borderRadius: 8, padding: "6px 14px",
              fontSize: 13, cursor: uploading ? "wait" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >{uploading ? "Extracting…" : "Add URL"}</button>
          <button
            onClick={() => setShowPasteModal(true)}
            style={{
              background: "#f0ebe0", color: "#7a6040",
              border: "0.5px solid #d9cdb0", borderRadius: 8, padding: "6px 12px",
              fontSize: 13, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >📋 Paste Text</button>
        </div>
        {uploadError && <span style={{ fontSize: 12, color: "#b71c1c" }}>{uploadError}</span>}

      {/* Paste text modal */}
      {showPasteModal && (
        <div
          onClick={() => setShowPasteModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(30,25,20,0.5)",
            zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, padding: 28,
              maxWidth: 560, width: "100%", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#2a2420", margin: "0 0 8px" }}>
              Paste Listing Text
            </h3>
            <p style={{ fontSize: 13, color: "#8a7f74", margin: "0 0 16px", lineHeight: 1.6 }}>
              Most listing sites (Zillow, Rightmove, French Estate Agents, etc.) block direct scraping. Instead, open the listing, select all the text on the page, copy it, and paste it here — Claude will extract all the details automatically.
            </p>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste listing text here… (include price, bedrooms, description, agent name, etc.)"
              style={{
                width: "100%", height: 180, border: "0.5px solid #e2ddd5", borderRadius: 10,
                padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                color: "#2a2420", background: "#faf8f5", resize: "vertical", outline: "none",
                boxSizing: "border-box",
              }}
            />
            {uploadError && <p style={{ fontSize: 12, color: "#b71c1c", margin: "8px 0 0" }}>{uploadError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button
                onClick={handlePasteSubmit}
                disabled={uploading || !pasteText.trim()}
                style={{
                  flex: 1, background: "#2a2420", color: "#f5efe8",
                  border: "none", borderRadius: 10, padding: "10px 0",
                  fontSize: 13, cursor: uploading ? "wait" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                }}
              >{uploading ? "Extracting…" : "Extract & Add Listing"}</button>
              <button
                onClick={() => { setShowPasteModal(false); setUploadError(""); }}
                style={{
                  flex: 1, background: "#faf8f5", color: "#2a2420",
                  border: "0.5px solid #e2ddd5", borderRadius: 10, padding: "10px 0",
                  fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Column picker */}
      {showColumnPicker && view === "list" && (
        <div style={{
          background: "#fff", borderBottom: "0.5px solid #e2ddd5",
          padding: "10px 32px", display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {ALL_COLUMNS.map(col => (
            <label key={col} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer", color: "#2a2420" }}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => setSelectedColumns(prev =>
                  prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
                )}
              />
              {col}
            </label>
          ))}
        </div>
      )}

      {/* Custom field panel */}
      {showAddField && (
        <div style={{
          background: "#fff8f0", borderBottom: "0.5px solid #e2ddd5",
          padding: "12px 32px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, color: "#8a7f74" }}>Add custom field to:</span>
          <select
            value={customFieldTarget}
            onChange={e => setCustomFieldTarget(e.target.value)}
            style={{ border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "5px 8px", fontSize: 13, background: "#fff", fontFamily: "'DM Sans', sans-serif" }}
          >
            <option value="">Choose property</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input
            placeholder="Field name (e.g. School district)"
            value={customFieldKey}
            onChange={e => setCustomFieldKey(e.target.value)}
            style={{ border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "5px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: 180 }}
          />
          <input
            placeholder="Value"
            value={customFieldVal}
            onChange={e => setCustomFieldVal(e.target.value)}
            style={{ border: "0.5px solid #e2ddd5", borderRadius: 8, padding: "5px 10px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", width: 120 }}
          />
          <button
            onClick={addCustomField}
            style={{ background: "#2a2420", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >Save</button>
        </div>
      )}

      {/* Main content */}
      <div style={{ padding: "28px 32px" }}>

        {/* CARDS VIEW */}
        {view === "cards" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {sorted.map(p => (
              <PropertyCard
                key={p.id + (p.frontImage?.slice(-10) || "")}
                property={p}
                onRate={handleRate}
                onOpen={setDetailProperty}
              />
            ))}
            {sorted.length === 0 && <div style={{ color: "#8a7f74", gridColumn: "1/-1", textAlign: "center", padding: 60, fontSize: 15 }}>No properties match this filter.</div>}
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2ddd5", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#faf8f5", borderBottom: "0.5px solid #e2ddd5" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "#8a7f74", fontSize: 11, letterSpacing: "0.05em" }}>PROPERTY</th>
                  {selectedColumns.map(col => (
                    <th key={col} style={{ padding: "12px 12px", textAlign: "left", fontWeight: 500, color: "#8a7f74", fontSize: 11, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => setDetailProperty(p)}
                    style={{
                      borderBottom: "0.5px solid #f0ebe0",
                      cursor: "pointer",
                      background: i % 2 === 0 ? "#fff" : "#fdf9f6",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5efe8"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fdf9f6"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: "#2a2420" }}>{p.name}</div>
                    </td>
                    {selectedColumns.map(col => (
                      <td key={col} style={{ padding: "12px 12px", color: "#2a2420", verticalAlign: "middle" }}>{colVal(p, col)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GALLERY VIEW */}
        {view === "gallery" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {sorted.map(p => (
              <div
                key={p.id}
                onClick={() => setDetailProperty(p)}
                style={{
                  borderRadius: 14, overflow: "hidden", cursor: "pointer",
                  border: "0.5px solid #e2ddd5",
                  position: "relative", background: "#fff",
                }}
              >
                <div style={{ position: "relative", paddingTop: "80%" }}>
                  <img
                    src={p.frontImage}
                    alt={p.name}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(transparent, rgba(30,22,15,0.82))",
                    padding: "32px 14px 14px",
                  }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{p.location}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "#c9a84c", marginTop: 4, fontWeight: 600 }}>{fmtPrice(p.price)}</div>
                  </div>
                  <div style={{ position: "absolute", top: 10, right: 10 }}>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MAP VIEW */}
        {view === "map" && (
          <MapView properties={sorted} onSelectProperty={setDetailProperty} />
        )}

        {/* SUGGEST VIEW */}
        {view === "suggest" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: "#2a2420", margin: "0 0 6px" }}>
                Suggested Listings
              </h2>
              <p style={{ fontSize: 13, color: "#8a7f74", margin: 0 }}>
                Based on your top-rated properties, here are some you might love.
              </p>
            </div>

            {loadingSuggestions && (
              <div style={{ textAlign: "center", padding: 60, color: "#8a7f74" }}>
                ✨ Finding similar properties…
              </div>
            )}

            {!loadingSuggestions && suggestions.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: "#8a7f74" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                <div style={{ fontSize: 15, marginBottom: 8 }}>No suggestions yet</div>
                <button
                  onClick={handleSuggest}
                  style={{
                    background: "#2a2420", color: "#fff", border: "none",
                    borderRadius: 10, padding: "10px 24px", fontSize: 13,
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}
                >Generate Suggestions</button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: "0.5px solid #e2ddd5",
                  overflow: "hidden",
                }}>
                  <div style={{
                    background: `linear-gradient(135deg, #f5efe8 0%, #ede5d8 100%)`,
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 40,
                  }}>🏡</div>
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ background: "#f0ebe0", color: "#7a6040", fontSize: 10, borderRadius: 20, padding: "2px 8px", display: "inline-block", marginBottom: 8, fontWeight: 500, letterSpacing: "0.04em" }}>SUGGESTED</div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#2a2420", margin: "0 0 4px" }}>{s.name}</h3>
                    <p style={{ fontSize: 12, color: "#8a7f74", margin: "0 0 8px" }}>📍 {s.location}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#2a2420", fontWeight: 600, margin: "0 0 8px" }}>{fmtPrice(s.price)}</p>
                    <p style={{ fontSize: 12, color: "#5a7a6a", margin: "0 0 12px", fontStyle: "italic" }}>"{s.why}"</p>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(s.features || []).map(f => <FeatureBadge key={f} label={f} />)}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: "#8a7f74" }}>
                      🛏 {s.bedrooms} beds · 🚿 {s.bathrooms} baths
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  onClick={handleSuggest}
                  style={{
                    background: "transparent", color: "#2a2420",
                    border: "0.5px solid #e2ddd5", borderRadius: 10,
                    padding: "9px 20px", fontSize: 13, cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >↻ Refresh Suggestions</button>
              </div>
            )}
          </div>
        )}

        {/* ARCHIVE VIEW */}
        {view === "archive" && (
          <div>
            {archived.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, color: "#8a7f74" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 15 }}>No archived properties yet</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Archive a listing from its detail view to store it here</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {archived.map(p => (
                  <div key={p.id} style={{
                    background: "#fff", borderRadius: 12,
                    border: "0.5px solid #e2ddd5", padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                    opacity: 0.85,
                  }}>
                    {!isPlaceholder(p.frontImage) && (
                      <img src={p.frontImage} alt={p.name} style={{ width: 72, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: "#2a2420" }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#8a7f74" }}>📍 {p.location} · {fmtPrice(p.price)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleRestore(p.id)}
                        style={{
                          background: "#e6f7ee", color: "#1a7a45",
                          border: "0.5px solid #a3d9b8", borderRadius: 8,
                          padding: "7px 14px", fontSize: 12, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                        }}
                      >↩ Restore</button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) {
                            handleDeletePermanent(p.id);
                          }
                        }}
                        style={{
                          background: "#fdecea", color: "#b71c1c",
                          border: "0.5px solid #f5a7a4", borderRadius: 8,
                          padding: "7px 14px", fontSize: 12, cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                        }}
                      >🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailProperty && (
        <DetailModal
          key={detailProperty.id + "|" + (detailProperty.frontImage?.length || 0)}
          property={detailProperty}
          onClose={() => setDetailProperty(null)}
          onRate={handleRate}
          onUpdatePhotos={handleUpdatePhotos}
          onUpdateNotes={handleUpdateNotes}
          onUpdateDetails={handleUpdateDetails}
          onArchive={handleArchive}
        />
      )}
    </div>
  );
}
