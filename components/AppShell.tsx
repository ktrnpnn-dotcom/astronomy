"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Album } from "@/components/Album";
import { BottomNav, type TabId } from "@/components/BottomNav";
import { ProfileScreen } from "@/components/ProfileScreen";
import { Sheet } from "@/components/Sheet";
import { SkyCamera } from "@/components/SkyCamera";
import { TodayFeed } from "@/components/TodayFeed";
import { startLiveSession, stopStream, type LiveSession } from "@/lib/camera";
import { CITIES, cityById } from "@/lib/cities";
import { getSettingsServerSnapshot, getSettingsSnapshot, patchSettings, subscribeSettings } from "@/lib/storage";
import type { GeoFix, Observation, SkyError } from "@/types/sky";

type Phase = "intro" | "pending" | "error" | "view";

export function AppShell() {
  const [tab, setTab] = useState<TabId>("today");
  const settings = useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getSettingsServerSnapshot);
  const [phase, setPhase] = useState<Phase>("intro");
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<SkyError | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [resumeAfterCity, setResumeAfterCity] = useState(false);
  const origin = useRef<TabId>("map");
  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    document.documentElement.dataset.night = settings.nightVision ? "on" : "off";
  }, [settings.nightVision]);

  useEffect(() => {
    return () => stopStream(sessionRef.current?.stream);
  }, []);

  const city = cityById(settings.cityId);
  const place = session?.coords ?? cityFix(city.name, city.latitude, city.longitude);

  function leaveMap() {
    stopStream(sessionRef.current?.stream);
    setSession(null);
    setDemo(false);
    setError(null);
    setPhase("intro");
  }

  function changeTab(next: TabId) {
    if (next !== "map") leaveMap();
    if (next === "map") origin.current = "map";
    setTab(next);
  }

  async function openLive(focus: string | null, from: TabId) {
    origin.current = from;
    setFocusId(focus);
    setDemo(false);
    setError(null);
    setTab("map");
    setPhase("pending");
    stopStream(sessionRef.current?.stream);
    setSession(null);
    const result = await startLiveSession();
    if (!result.ok) {
      setError(result.error);
      setPhase("error");
      return;
    }
    if (result.session.geoError || !result.session.coords) {
      stopStream(result.session.stream);
      setError(result.session.geoError === "timeout" ? "geo-slow" : "geo-denied");
      setPhase("error");
      return;
    }
    setSession(result.session);
    setPhase("view");
  }

  async function continueWithCity(cityId: string) {
    const chosen = cityById(cityId);
    const coords = cityFix(chosen.name, chosen.latitude, chosen.longitude);
    setDemo(false);
    setError(null);
    setPhase("pending");
    setTab("map");
    stopStream(sessionRef.current?.stream);
    if (typeof window !== "undefined" && window.isSecureContext && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        setSession({ stream, coords, geoError: null });
        setPhase("view");
        return;
      } catch {
        setSession({ stream: null, coords, geoError: null });
        setPhase("view");
        return;
      }
    }
    setSession({ stream: null, coords, geoError: null });
    setPhase("view");
  }

  function openDemo() {
    stopStream(sessionRef.current?.stream);
    setSession(null);
    setError(null);
    setDemo(true);
    setPhase("view");
    setTab("map");
  }

  function closeMap() {
    const back = origin.current === "map" ? "today" : origin.current;
    leaveMap();
    setTab(back);
  }

  function chooseCity(cityId: string) {
    patchSettings((current) => ({ ...current, cityId }));
    setCityOpen(false);
    if (resumeAfterCity) {
      setResumeAfterCity(false);
      void continueWithCity(cityId);
    }
  }

  function observe(observation: Observation) {
    patchSettings((current) => ({
      ...current,
      observations: [observation, ...current.observations].slice(0, 40),
    }));
  }

  const immersive = tab === "map" && phase !== "intro";

  return (
    <div className="app-shell">
      <div className="stage">
        {tab === "today" ? (
          <TodayFeed
            cityName={city.name}
            latitude={city.latitude}
            longitude={city.longitude}
            cloudy={settings.cloudyDemo}
            reminded={settings.reminders}
            onChangeCity={() => {
              setResumeAfterCity(false);
              setCityOpen(true);
            }}
            onOpenProfile={() => changeTab("profile")}
            onShowSky={(objectId) => void openLive(objectId, "today")}
            onRemind={(eventId) =>
              patchSettings((current) => ({
                ...current,
                reminders: current.reminders.includes(eventId) ? current.reminders : [...current.reminders, eventId],
              }))
            }
          />
        ) : null}
        {tab === "map" ? (
          <SkyCamera
            phase={phase}
            demo={demo}
            error={error}
            stream={session?.stream ?? null}
            coords={demo ? null : place}
            placeLabel={place.label}
            cloudy={settings.cloudyDemo}
            focusId={focusId}
            showConstellations={settings.showConstellations}
            onStart={() => void openLive(focusId, "map")}
            onDemo={openDemo}
            onClose={closeMap}
            onRetry={() => void openLive(focusId, origin.current)}
            onPickCity={() => {
              setResumeAfterCity(true);
              setCityOpen(true);
            }}
            onObserve={observe}
          />
        ) : null}
        {tab === "album" ? <Album observations={settings.observations} /> : null}
        {tab === "profile" ? (
          <ProfileScreen
            cityId={settings.cityId}
            nightVision={settings.nightVision}
            cloudy={settings.cloudyDemo}
            constellations={settings.showConstellations}
            onCity={() => {
              setResumeAfterCity(false);
              setCityOpen(true);
            }}
            onNight={(nightVision) => patchSettings((current) => ({ ...current, nightVision }))}
            onCloudy={(cloudyDemo) => patchSettings((current) => ({ ...current, cloudyDemo }))}
            onConstellations={(showConstellations) => patchSettings((current) => ({ ...current, showConstellations }))}
          />
        ) : null}
      </div>
      {immersive ? null : <BottomNav tab={tab} onChange={changeTab} />}
      <Sheet open={cityOpen} title="Город" onClose={() => setCityOpen(false)}>
        <h2 className="font-title text-[30px]">Город</h2>
        <div className="mt-3 flex flex-col gap-2">
          {CITIES.map((item) => (
            <button key={item.id} type="button" className="btn btn-secondary justify-start" onClick={() => chooseCity(item.id)}>
              {item.name}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function cityFix(label: string, latitude: number, longitude: number): GeoFix {
  return { label, latitude, longitude, accuracy: null, source: "city" };
}
