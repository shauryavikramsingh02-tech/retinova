import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Phone, 
  Star, 
  Search, 
  Filter, 
  Navigation, 
  IndianRupee, 
  Calendar, 
  Award, 
  ShieldCheck,
  Building,
  CheckCircle
} from 'lucide-react';
import { Doctor } from '../types';
import { fetchDoctors } from '../services/api';
import { calculateHaversineDistance } from '../data/specialists';

interface DoctorsDirectoryViewProps {
  onBookDoctor: (doctor: Doctor) => void;
}

export const DoctorsDirectoryView: React.FC<DoctorsDirectoryViewProps> = ({
  onBookDoctor,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // User/Clinic Location Reference (Default: New Delhi AIIMS coordinates)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; label: string }>({
    lat: 28.5672,
    lng: 77.2100,
    label: 'New Delhi (Clinic HQ)',
  });
  const [locating, setLocating] = useState(false);

  const cityOptions = [
    { id: 'all', label: 'All Cities' },
    { id: 'Delhi', label: 'Delhi NCR' },
    { id: 'Mumbai', label: 'Mumbai' },
    { id: 'Bengaluru', label: 'Bengaluru' },
    { id: 'Chennai', label: 'Chennai' },
    { id: 'Hyderabad', label: 'Hyderabad' },
    { id: 'Kolkata', label: 'Kolkata' },
    { id: 'Pune', label: 'Pune' },
  ];

  // Load doctors on mount or city change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchDoctors(userLocation.lat, userLocation.lng, selectedCity);
      setDoctors(data);
      setLoading(false);
    }
    loadData();
  }, [selectedCity, userLocation]);

  // Request browser geolocation
  const handleUseBrowserGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Current GPS Location',
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve GPS location. Keeping current reference city.');
      },
      { timeout: 8000 }
    );
  };

  // Filtered by search
  const filteredDoctors = doctors.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.hospital.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider font-mono">
            Telemedicine Specialist Network • Vitreoretinal Sub-Specialty
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
            Verified Indian Retina Specialists & Tertiary Eye Centers
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Accredited vitreoretinal surgeons, laser photocoagulation consultants, and diabetic eye care facilities across India.
          </p>
        </div>

        {/* Location Picker Pill */}
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs shrink-0">
          <MapPin className="w-4 h-4 text-teal-600" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">Reference Origin:</span>
            <span className="font-semibold text-slate-800">{userLocation.label}</span>
          </div>
          <button
            onClick={handleUseBrowserGPS}
            disabled={locating}
            title="Use Device GPS to Recalculate Distances"
            className="p-1.5 ml-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="clinical-card p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by doctor name, hospital, or subspecialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* City Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {cityOptions.map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCity === city.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {city.label}
            </button>
          ))}
        </div>
      </div>

      {/* Specialist Cards Grid */}
      {loading ? (
        <div className="clinical-card p-12 text-center bg-white">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">Loading specialist registry & Haversine distances...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="clinical-card p-12 text-center bg-white space-y-2">
          <p className="text-sm font-bold text-slate-800">No specialists found</p>
          <p className="text-xs text-slate-500">Try changing your city filter or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="clinical-card p-5 bg-white flex flex-col justify-between hover:shadow-md transition-all border border-slate-200"
            >
              <div>
                {/* Doctor Header: Name, Qualifications, Rating */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-teal-600" title="Verified Vitreoretinal Specialist" />
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{doc.qualifications}</p>
                    <p className="text-xs font-semibold text-teal-700">{doc.specialty}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center space-x-1 text-amber-500 justify-end">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold text-slate-800 font-mono">{doc.rating ?? 4.8}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ({doc.reviewCount ?? doc.review_count ?? 120} reviews)
                    </span>
                  </div>
                </div>

                {/* Hospital & Location */}
                <div className="py-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start space-x-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 block">{doc.hospital}</span>
                      <span className="text-[11px] text-slate-500 leading-tight block">{doc.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1 text-teal-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>{doc.city}</span>
                    </div>

                    {(doc.distanceKm !== undefined && doc.distanceKm !== null) || (doc.distance_km !== undefined && doc.distance_km !== null) ? (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        {doc.distanceKm ?? doc.distance_km} km away
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Badges: Fee & Experience */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Consultation Fee</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      ₹{(doc.consultationFee ?? doc.consultation_fee ?? 1000).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Clinical Experience</span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {doc.experienceYears ?? doc.experience_years ?? 15}+ Years
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Phone & Book Referral */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${doc.phone}`}
                  className="flex items-center justify-center p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                  title={`Call ${doc.phone}`}
                >
                  <Phone className="w-4 h-4" />
                </a>

                <button
                  onClick={() => onBookDoctor(doc)}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Specialist Referral</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
