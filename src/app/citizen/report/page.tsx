'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Compass,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
  Crosshair,
  Sliders,
  MapPin,
} from 'lucide-react';
import { MapView } from '@/components/MapView';
import { requestBrowserLocation } from '@/lib/geo/geolocation';

type StepState = 'pending' | 'running' | 'done' | 'error';

interface PipelineStatus {
  step1: StepState; // Image analysis
  step2: StepState; // Location & Road Segment
  step3: StepState; // 100km Accident Intelligence
  step4: StepState; // Authority Routing
  step5: StepState; // Priority Risk Assessment
  step6: StepState; // Case Creation
}

export default function ReportIssuePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Location State
  const [latitude, setLatitude] = useState<number>(21.2514);
  const [longitude, setLongitude] = useState<number>(81.6296);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [selectedRoadName, setSelectedRoadName] = useState<string>('');
  const [locationSource, setLocationSource] = useState<'gps' | 'manual'>('manual');
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualCoords, setShowManualCoords] = useState<boolean>(false);
  const [showManualAddress, setShowManualAddress] = useState<boolean>(false);
  const [manualCity, setManualCity] = useState<string>('');
  const [manualLocality, setManualLocality] = useState<string>('');
  const [manualRoad, setManualRoad] = useState<string>('');
  const [geocodingManual, setGeocodingManual] = useState<boolean>(false);
  const [showLocationMap, setShowLocationMap] = useState<boolean>(true);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    step1: 'pending',
    step2: 'pending',
    step3: 'pending',
    step4: 'pending',
    step5: 'pending',
    step6: 'pending',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Handlers with strict type & size validation
  const handleFileSelect = (file: File) => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_BYTES) {
      alert('Image file size exceeds the 10MB limit. Please upload a smaller image.');
      return;
    }

    const sizeFormatted = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setImageFileName(file.name);
    setImageMimeType(file.type);
    setImageFileSize(sizeFormatted);

    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Browser Geolocation Acquisition (Privacy-conscious, explicit user action)
  const handleGetLocation = async () => {
    setGpsLoading(true);
    setLocationError(null);

    const res = await requestBrowserLocation();
    if (res.success) {
      setLatitude(res.latitude);
      setLongitude(res.longitude);
      setGpsAccuracy(res.accuracyMeters);
      setLocationSource('gps');
      setSelectedRoadName('');
      setLocationError(null);
    } else {
      setLocationError(res.error);
    }
    setGpsLoading(false);
  };

  // Manual Location Entry Geocoding Fallback
  const handleGeocodeManualAddress = async () => {
    if (!manualCity.trim() && !manualLocality.trim() && !manualRoad.trim()) {
      setLocationError('Please enter at least a City or Locality name.');
      return;
    }

    setGeocodingManual(true);
    setLocationError(null);

    try {
      const res = await fetch('/api/identify-road', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualParts: {
            city: manualCity.trim(),
            locality: manualLocality.trim(),
            road: manualRoad.trim(),
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Unable to identify the entered location.');
      }

      const data = await res.json();
      setLatitude(data.latitude);
      setLongitude(data.longitude);
      setGpsAccuracy(null);
      setLocationSource('manual');
      // Priority: 1. User-entered road name, 2. OSM returned road name, 3. Empty
      const resolvedRoad = manualRoad.trim() || (data.roadName && !data.roadName.includes('unavailable') ? data.roadName : '');
      setSelectedRoadName(resolvedRoad);
      setLocationError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to identify the road from this location.';
      setLocationError(msg);
    } finally {
      setGeocodingManual(false);
    }
  };

  // AI Pipeline Execution
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview) {
      alert('Please upload a road photograph.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Step 1: Detect Road Hazard (Groq Vision)
      setPipelineStatus(s => ({ ...s, step1: 'running' }));
      const visionRes = await fetch('/api/analyze-road', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageMimeType,
          fileName: imageFileName,
        }),
      });

      if (!visionRes.ok) {
        const errJson = await visionRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Vision AI analysis failed');
      }
      const hazardAnalysis = await visionRes.json();
      setPipelineStatus(s => ({ ...s, step1: 'done', step2: 'running' }));

      // Step 2: Identify Road Segment & Geocoding (OSM Nominatim)
      // Strictly preserve user-entered road name across the entire pipeline
      const userPreservedRoad = manualRoad.trim() || selectedRoadName.trim() || undefined;
      const roadRes = await fetch('/api/identify-road', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          userRoadName: userPreservedRoad,
          fallbackRoadName: selectedRoadName || undefined,
          manualParts: locationSource === 'manual' ? {
            city: manualCity.trim(),
            locality: manualLocality.trim(),
            road: manualRoad.trim(),
          } : undefined,
        }),
      });

      if (!roadRes.ok) {
        const errJson = await roadRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Road identification failed');
      }
      const locationData = await roadRes.json();
      // Enforce user entered road name if present
      if (userPreservedRoad) {
        locationData.roadName = userPreservedRoad;
      }
      locationData.gpsAccuracy = gpsAccuracy ?? undefined;
      locationData.source = locationSource;
      setPipelineStatus(s => ({ ...s, step2: 'done', step3: 'running' }));

      // Step 3: Check 100km Accident Intelligence (NewsAPI + Groq)
      const accidentRes = await fetch('/api/accidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadName: locationData.roadName,
          locality: locationData.locality,
          district: locationData.district,
          state: locationData.state,
          latitude,
          longitude,
        }),
      });

      const accidentIntelligence = accidentRes.ok
        ? await accidentRes.json()
        : {
            events: [],
            totalFound: 0,
            highRelevanceCount: 0,
            summary: 'Public accident records unavailable.',
          };
      setPipelineStatus(s => ({ ...s, step3: 'done', step4: 'running' }));

      // Step 4: Authority Routing Engine (Deterministic statutory routing)
      const routingRes = await fetch('/api/route-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: locationData,
          isLiveCase: true,
        }),
      });

      if (!routingRes.ok) {
        const errJson = await routingRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Authority routing failed');
      }
      const authorityRouting = await routingRes.json();
      setPipelineStatus(s => ({ ...s, step4: 'done', step5: 'running' }));

      // Step 5: Priority / Risk Assessment
      const priorityRes = await fetch('/api/calculate-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazardAnalysis,
          accidentEvents: accidentIntelligence.events,
          citizenReportCount: 1,
          roadCategory: locationData.roadCategory,
        }),
      });

      if (!priorityRes.ok) {
        const errJson = await priorityRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Priority assessment failed');
      }
      const priorityAssessment = await priorityRes.json();
      setPipelineStatus(s => ({ ...s, step5: 'done', step6: 'running' }));

      // Step 6: Create Case in Supabase Backend
      const caseRes = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: 'citizen-current-user',
          imageUrl: imagePreview,
          location: locationData,
          hazardAnalysis,
          accidentIntelligence,
          authorityRouting,
          priorityAssessment,
          priority: priorityAssessment.priority,
          status: 'REPORTED',
          citizenReportCount: 1,
          isDemo: false,
          realityMetadata: {
            photoSource: 'USER_UPLOAD',
            photoFileName: imageFileName,
            locationSource: locationSource === 'gps' ? 'BROWSER_GPS' : 'MANUAL_COORDINATES',
            gpsAccuracyMeters: gpsAccuracy ?? undefined,
            geocodingProvider: 'OPENSTREETMAP_NOMINATIM',
            accidentRadiusKm: 100,
            accidentIntelligenceCount: accidentIntelligence.events.length,
            authorityRoutingMethod: 'DETERMINISTIC_REGISTRY',
            persistenceBackend: 'SUPABASE_POSTGRESQL',
          },
        }),
      });

      if (!caseRes.ok) {
        const errJson = await caseRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'Case creation failed');
      }
      const createdCase = await caseRes.json();
      setPipelineStatus(s => ({ ...s, step6: 'done' }));

      setTimeout(() => {
        router.push(`/citizen/reports/${createdCase.id}`);
      }, 700);
    } catch (err: unknown) {
      console.error('Submission pipeline error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred during AI processing.';
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Sewa Setu Digital Public Service Delivery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
          New Road Hazard Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Submit real photographic evidence and browser location. KIZUNA executes Groq Vision AI analysis, inspects 100 km accident precedents, and determines the responsible statutory authority.
        </p>
      </div>

      {/* Processing Animated Overlay Modal */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                KIZUNA AI Intelligence Pipeline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Processing real multimodal evidence and establishing public accountability docket...
              </p>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {pipelineStatus.step1 === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : pipelineStatus.step1 === 'running' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    1. Detecting road hazard (Groq Vision AI)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {pipelineStatus.step1}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {pipelineStatus.step2 === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : pipelineStatus.step2 === 'running' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    2. Identifying road segment (OpenStreetMap Geocoding)
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {pipelineStatus.step2}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {pipelineStatus.step3 === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : pipelineStatus.step3 === 'running' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    3. Checking 100km corridor accident precedents
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {pipelineStatus.step3}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {pipelineStatus.step4 === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : pipelineStatus.step4 === 'running' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    4. Routing to responsible statutory authority
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {pipelineStatus.step4}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {pipelineStatus.step5 === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : pipelineStatus.step5 === 'running' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    5. Assessing AI priority &amp; risk factors
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {pipelineStatus.step5}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  {pipelineStatus.step6 === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : pipelineStatus.step6 === 'running' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    6. Creating verified case &amp; routing to authority
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  {pipelineStatus.step6}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Pipeline Execution Notice</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Reporting Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Upload Photograph */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">
                  1
                </span>
                Upload Real Road Photograph
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload real photographic evidence. Groq Vision AI analyzes road surface damage, potholes, and barriers.
              </p>
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFileName('');
                  setImageFileSize('');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>

          {/* Drag & Drop Area */}
          {!imagePreview ? (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to select photo, or drag and drop here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, WebP up to 10MB (Validated Client-Side)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            <div className="relative aspect-video max-h-[340px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Selected road hazard"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">{imageFileName || 'Road Photograph'}</span>
                {imageFileSize && (
                  <span className="text-slate-400 font-mono text-[11px]">({imageFileSize})</span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-emerald-600 text-white">
                  Live Upload
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:bg-white transition"
              >
                Replace Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Step 2: Location Intelligence */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">
                  2
                </span>
                Road &amp; Geographic Location
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Acquire coordinates to snap to the nearest road segment and determine administrative jurisdiction.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowManualAddress(m => !m);
                  if (showManualCoords) setShowManualCoords(false);
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
                  showManualAddress
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{showManualAddress ? 'Hide Address Input' : 'Enter Location Manually'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowManualCoords(m => !m);
                  if (showManualAddress) setShowManualAddress(false);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showManualCoords ? 'Hide Lat/Lng' : 'Adjust GPS'}</span>
              </button>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm active:scale-98"
              >
                <Compass className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Detecting location...' : 'Use My Current Location'}</span>
              </button>
            </div>
          </div>

          {locationError && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Coordinate Readout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Target Latitude
                </span>
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {latitude.toFixed(6)}° N
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  locationSource === 'gps'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                }`}>
                  {locationSource === 'gps' ? 'Live Browser GPS' : 'Manual GPS Input'}
                </span>
                {gpsAccuracy !== null && locationSource === 'gps' && (
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    gpsAccuracy <= 25
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : gpsAccuracy <= 100
                      ? 'bg-amber-50 text-amber-700 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}>
                    Accuracy: &plusmn;{Math.round(gpsAccuracy)}m
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Target Longitude
                </span>
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {longitude.toFixed(6)}° E
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-blue-500" />
                Verified
              </span>
            </div>
          </div>

          {/* Manual Address Input Fallback */}
          {showManualAddress && (
            <div className="p-4 mb-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Enter Location Manually (OpenStreetMap Geocoding)
                </span>
                <span className="text-[11px] text-slate-500">
                  Used when GPS is denied or unavailable
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">City / District *</label>
                  <input
                    type="text"
                    placeholder="e.g. Raipur, Bilaspur, Pune"
                    value={manualCity}
                    onChange={e => setManualCity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Locality / Sector</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Lines, Main Market"
                    value={manualLocality}
                    onChange={e => setManualLocality(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 dark:text-slate-400 block mb-1 font-medium">Road / Street Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Station Road, Ring Road"
                    value={manualRoad}
                    onChange={e => setManualRoad(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {locationSource === 'manual' && latitude !== 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      OSM Coordinates: {latitude.toFixed(5)}°, {longitude.toFixed(5)}°
                      {selectedRoadName ? ` • Road: ${selectedRoadName}` : ' • Road name unavailable from map'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleGeocodeManualAddress}
                  disabled={geocodingManual}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 ml-auto"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${geocodingManual ? 'animate-spin' : ''}`} />
                  <span>{geocodingManual ? 'Resolving via OpenStreetMap...' : 'Geocode Location'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Manual Coordinate Numerical Inputs */}
          {showManualCoords && (
            <div className="p-4 mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Manual Coordinate Adjustment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={e => {
                      setLatitude(parseFloat(e.target.value) || 0);
                      setLocationSource('manual');
                      setSelectedRoadName('');
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={e => {
                      setLongitude(parseFloat(e.target.value) || 0);
                      setLocationSource('manual');
                      setSelectedRoadName('');
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Interactive OpenStreetMap Preview with 100km Radius */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>OpenStreetMap Interactive Preview &amp; 100 KM Radius Boundary</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLocationMap(s => !s)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
              >
                {showLocationMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
            {showLocationMap && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <MapView
                  centerLat={latitude}
                  centerLng={longitude}
                  zoom={12}
                  height="260px"
                  show100KmRadius={true}
                  markers={[
                    {
                      id: 'user-preview-location',
                      latitude,
                      longitude,
                      title: 'Reported Location',
                      roadName: selectedRoadName || 'Report Location Pin',
                      priority: 'HIGH',
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 max-w-sm">
            By submitting, you certify this is an actual road condition for public safety remediation.
          </p>

          <button
            type="submit"
            disabled={!imagePreview || isProcessing}
            className={`px-7 py-3.5 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-2 ${
              !imagePreview || isProcessing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-98'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyze &amp; Create Case</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
