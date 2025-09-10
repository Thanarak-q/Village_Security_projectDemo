// ===== Helper Types =====
export interface LiffInit {
  liffId: string;
  withLoginOnExternalBrowser?: boolean;
}
export interface LiffLoginParams { redirectUri?: string; }
export interface LiffOpenWindowParams { url: string; external?: boolean; }
export interface LiffMessage { type: "text"; text: string; }

// ===== LIFF SDK Types =====
export interface LiffSDK {
  init(config: LiffInit): Promise<void>;
  isLoggedIn(): boolean;
  login(params?: LiffLoginParams): void;
  logout(): void;

  getProfile(): Promise<{
    userId: string;
    displayName?: string;
    pictureUrl?: string;
    statusMessage?: string;
    language?: string;
  }>;

  isInClient(): boolean;
  sendMessages(messages: LiffMessage[]): Promise<void>;
  closeWindow(): void;

  getOS(): "ios" | "android" | "web";
  getLanguage(): string;
  getVersion(): string;
  getLineVersion(): string;
  isApiAvailable(apiName: string): boolean;

  openWindow(params: LiffOpenWindowParams): void;

  /** มีใน LIFF SDK: ใช้ตรวจว่ามี access token สดอยู่ไหม */
  getAccessToken(): string | null;
  getIDToken(): string | null;
  getDecodedIDToken(): any;
}

declare global {
  interface Window { liff: LiffSDK; }
}

export interface LiffProfile {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
}

export class LiffService {
  private static instance: LiffService;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private profileCache: LiffProfile | null = null;
  private scriptLoaded = false;

  private contextCache: {
    os?: "ios" | "android" | "web" | "unknown";
    language?: string;
    apiAvailability?: Record<string, boolean>;
    timestamp?: number;
  } = {};
  private readonly CACHE_DURATION = 30_000; // 30s

  static getInstance(): LiffService {
    if (!LiffService.instance) LiffService.instance = new LiffService();
    return LiffService.instance;
  }

  // --- Helpers ---
  private hasLiff(): boolean {
    return typeof window !== "undefined" && !!(window as Window & { liff?: LiffSDK }).liff;
  }
  private currentBase(): string {
    return typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "/";
  }

  // รอให้ window.liff โผล่ภายใน timeLimit ms (กันกรณี SDK โหลดช้า/โดน extension หน่วง)
  private async waitForLiff(timeLimit = 5000): Promise<boolean> {
    if (this.hasLiff()) return true;
    const start = Date.now();
    while (!this.hasLiff() && Date.now() - start < timeLimit) {
      await new Promise(r => setTimeout(r, 100));
    }
    return this.hasLiff();
  }

  // --- Init & SDK Loader ---
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (this.initialized) return Promise.resolve();

    this.initPromise = new Promise((resolve) => {
      if (typeof window === "undefined") { resolve(); return; }

      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId) { console.warn("LIFF ID not configured"); resolve(); return; }

      const w = window as Window & { liff?: LiffSDK };

      // SDK พร้อมแล้ว
      if (this.scriptLoaded && w.liff) {
        this.initLiff(liffId).then(resolve);
        return;
      }

      // เจอสคริปต์อยู่แล้ว
      const existingScript = document.querySelector('script[src*="liff/edge/2/sdk.js"]');
      if (existingScript) {
        this.scriptLoaded = true;
        this.initLiff(liffId).then(resolve);
        return;
      }

      // โหลด SDK
      const script = document.createElement("script");
      script.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
      script.async = true;
      script.onload = () => { this.scriptLoaded = true; this.initLiff(liffId).then(resolve); };
      script.onerror = () => { console.warn("Failed to load LIFF SDK"); resolve(); };
      document.head.appendChild(script);
    });

    return this.initPromise;
  }

  private async initLiff(liffId: string): Promise<void> {
    try {
      // เผื่อ SDK ยังไม่โผล่ทันที
      const ok = await this.waitForLiff();
      if (!ok) throw new Error("LIFF SDK not loaded yet");
      
      // Check if we're on Android and add extra delay
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        console.log("🤖 Android detected, adding extra initialization delay");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await window.liff.init({
        liffId,
        withLoginOnExternalBrowser: true, // สำคัญสำหรับ browser ภายนอก (auto-login)
      });
      this.initialized = true;
      console.log("✅ LIFF initialized successfully");
    } catch (error) {
      console.warn("LIFF init failed:", error);
      throw error; // Re-throw to handle in the calling code
    }
  }

  // --- Auth Flow ---
  async login(redirectUri?: string): Promise<void> {
    if (!this.initialized || !this.hasLiff()) {
      console.warn("LIFF not initialized");
      return;
    }
    if (!window.liff.isLoggedIn()) {
      try {
        window.liff.login(redirectUri ? { redirectUri } : undefined);
        // รอให้ OAuth redirect (promise ค้างไว้)
        return new Promise<never>(() => {});
      } catch (error) {
        console.warn("Failed to login:", error);
      }
    }
  }

  logout(): void {
    try {
      if (this.initialized && this.hasLiff()) window.liff.logout();
    } catch (e) {
      console.warn("Logout failed:", e);
    }
  }

  isLoggedIn(): boolean {
    return this.initialized && this.hasLiff() && window.liff.isLoggedIn();
  }

  /** ดึง access token (ถ้ามี) */
  getAccessToken(): string | null {
    try { return this.hasLiff() ? window.liff.getAccessToken() : null; }
    catch { return null; }
  }

  /** ดึง ID token (ถ้ามี) */
  getIDToken(): string | null {
    try { return this.hasLiff() ? window.liff.getIDToken() : null; }
    catch { return null; }
  }

  // ใช้เมื่อเจอ ?error=access_denied
  retryConsent(customBase?: string): void {
    try { if (this.hasLiff()) window.liff.logout(); } catch {}
    const base = customBase ?? this.currentBase();
    const uri = `${base}?retry=${Date.now()}`; // บัสต์แคช/กันลูป
    this.openWindow(uri, false);               // เปิดใน WebView เดิมก่อน
  }

  // ---- Fallback helper: ยิงเข้า LIFF URL ตรง ๆ ----
  forceOpenLiffDirect(redirectUri?: string): void {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
    if (!liffId) {
      console.warn("LIFF ID not configured");
      return;
    }
    const uri = redirectUri ?? (typeof window !== "undefined" ? window.location.href : "/");
    const url = `https://liff.line.me/${liffId}?redirect_uri=${encodeURIComponent(uri)}`;
    try {
      window.location.replace(url);
    } catch {
      window.location.href = url;
    }
  }
  // --------------------------------------------------

  // --- LIFF APIs ---
  async getProfile(): Promise<LiffProfile> {
    if (this.profileCache) return this.profileCache;
    if (!this.initialized || !this.hasLiff()) {
      console.warn("LIFF not initialized");
      return this.getDefaultProfile();
    }
    if (!window.liff.isLoggedIn()) {
      console.warn("User not logged in");
      return this.getDefaultProfile();
    }

    try {
      const p = await window.liff.getProfile();
      this.profileCache = {
        userId: p.userId,
        displayName: p.displayName,
        pictureUrl: p.pictureUrl,
      };
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 LIFF Profile:", this.profileCache);
      }
      return this.profileCache;
    } catch (error) {
      console.warn("Failed to get LIFF profile:", error);
      return this.getDefaultProfile();
    }
  }

  openWindow(url: string, external = true): void {
    try {
      if (this.hasLiff()) window.liff.openWindow({ url, external });
      else window.location.href = url;
    } catch {
      window.location.href = url;
    }
  }

  // Check available scopes (for debugging)
  checkScopes = () => {
    try {
      const idToken = this.getIDToken();
      if (idToken) {
        console.log('🔑 ID Token available');
        // Try to decode the token to see what scopes are available
        const decoded = this.hasLiff() ? window.liff.getDecodedIDToken() : null;
        console.log('🔍 Decoded ID Token:', decoded);
      } else {
        console.log('❌ No ID Token available');
      }
    } catch (error) {
      console.log('❌ Error checking scopes:', error);
    }
  }

  isInClient(): boolean {
    try { return this.initialized && this.hasLiff() && window.liff.isInClient(); }
    catch { return false; }
  }

  /** Get LINE user ID from profile */
  getLineUserId(): string | null {
    try {
      if (this.profileCache && typeof this.profileCache.userId === "string") {
        return this.profileCache.userId;
      }
      if (!this.initialized || !this.hasLiff()) return null;
      if (!window.liff.isLoggedIn()) return null;
      // Try to get from profileCache again (may be null)
      if (this.profileCache && typeof this.profileCache.userId === "string") {
        return this.profileCache.userId;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Clear all cached data */
  clearCache(): void { 
    this.profileCache = null; 
    this.contextCache = {}; 
  }

  /** Get default profile for fallback */
  private getDefaultProfile(): LiffProfile {
    return { userId: "unknown", displayName: "Unknown User" };
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.initialized || !this.hasLiff()) { console.warn("LIFF not initialized"); return; }
    if (!this.isInClient()) { console.warn("Not in LINE client"); return; }
    try { await window.liff.sendMessages([{ type: "text", text: message }]); }
    catch (error) { console.warn("Failed to send message:", error); }
  }

  closeWindow(): void {
    try { if (this.initialized && this.isInClient() && this.hasLiff()) window.liff.closeWindow(); }
    catch (error) { console.warn("Failed to close window:", error); }
  }

  // (ตัวอย่าง helper cache หากต้องใช้ต่อ)
  private safeGetOS(): "ios" | "android" | "web" | "unknown" {
    const now = Date.now();
    if (this.contextCache.os && this.contextCache.timestamp && now - this.contextCache.timestamp < this.CACHE_DURATION) {
      return this.contextCache.os;
    }
    try {
      if (!this.hasLiff()) throw new Error("LIFF not available");
      this.contextCache.os = window.liff.getOS() ?? "unknown";
      this.contextCache.timestamp = now;
      return this.contextCache.os;
    } catch {
      this.contextCache.os = "unknown";
      return "unknown";
    }
  }
}

// Legacy exports for backward compatibility
export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '2008071362';

export const initLiff = async (): Promise<boolean> => {
  try {
    const svc = LiffService.getInstance();
    await svc.init();
    return svc.isLoggedIn() || true; // Return true if initialized successfully
  } catch (error) {
    console.error('❌ LIFF initialization failed:', error);
    return false;
  }
};

export const isLoggedIn = (): boolean => {
  return LiffService.getInstance().isLoggedIn();
};

export const getLineProfile = async () => {
  const svc = LiffService.getInstance();
  const profile = await svc.getProfile();
  return profile.userId !== "unknown" ? profile : null;
};

export const getAccessToken = (): string | null => {
  return LiffService.getInstance().getAccessToken();
};

export const getIDToken = (): string | null => {
  return LiffService.getInstance().getIDToken();
};

export const isInLineApp = (): boolean => {
  return LiffService.getInstance().isInClient();
};
