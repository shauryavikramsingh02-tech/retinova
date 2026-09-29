/**
 * RetinaCare Auth Manager
 * Manages role-based session states, navbar rendering, and page route guarding.
 */

const Auth = {
  TOKEN_KEY: "retinacare_token",
  USER_KEY: "retinacare_user",

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  async logout(redirectUrl = "/pages/login.html") {
    try {
      if (typeof AuthAPI !== "undefined" && AuthAPI.logout) {
        await AuthAPI.logout();
      }
    } catch (err) {
      console.warn("Server logout notification skipped:", err);
    } finally {
      this.clearSession();
      window.location.href = redirectUrl;
    }
  },

  /**
   * Protect a page by verifying authentication and role.
   * If not logged in or role mismatch, redirects to appropriate portal.
   */
  protectPage(allowedRoles = [], fallbackLogin = "/pages/login.html") {
    const user = this.getUser();
    const token = this.getToken();

    if (!user || !token) {
      // Determine best portal redirect based on expected roles
      if (allowedRoles.length === 1) {
        if (allowedRoles[0] === "admin") fallbackLogin = "/pages/login-admin.html";
        else if (allowedRoles[0] === "doctor") fallbackLogin = "/pages/login-doctor.html";
        else if (allowedRoles[0] === "patient") fallbackLogin = "/pages/login-patient.html";
      }
      window.location.href = fallbackLogin;
      return false;
    }

    // Role verification
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === "patient") {
        window.location.href = "/pages/patient_portal.html";
        return false;
      } else if (user.role === "admin") {
        // Admin has general access, but if page is strictly patient, redirect
        if (!allowedRoles.includes("admin")) {
          window.location.href = "/pages/admin.html";
          return false;
        }
      } else if (user.role === "doctor") {
        if (!allowedRoles.includes("doctor")) {
          window.location.href = "/";
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Dynamically render navigation links and user identity badge in header
   */
  setupNavbar() {
    const user = this.getUser();
    const navLinks = document.querySelector(".nav-links");
    const navMeta = document.querySelector(".nav-meta");

    if (!navLinks) return;

    const currentPath = window.location.pathname.toLowerCase();

    // 1. Role-specific links
    if (user && user.role === "patient") {
      navLinks.innerHTML = `
        <li><a href="/pages/patient_portal.html" class="nav-link ${currentPath.includes('patient_portal') ? 'active' : ''}">My Health Portal</a></li>
        <li><a href="/pages/login.html" class="nav-link">Switch Portal</a></li>
      `;
    } else if (user && user.role === "admin") {
      navLinks.innerHTML = `
        <li><a href="/pages/admin.html" class="nav-link ${currentPath.includes('admin.html') ? 'active' : ''}">Admin Console</a></li>
        <li><a href="/" class="nav-link ${currentPath === '/' || currentPath.endsWith('index.html') ? 'active' : ''}">Clinician View</a></li>
        <li><a href="/pages/patients.html" class="nav-link ${currentPath.includes('patients.html') ? 'active' : ''}">Patients</a></li>
        <li><a href="/pages/screenings.html" class="nav-link ${currentPath.includes('screenings.html') ? 'active' : ''}">Screenings Log</a></li>
      `;
    } else if (user && user.role === "doctor") {
      navLinks.innerHTML = `
        <li><a href="/" class="nav-link ${currentPath === '/' || currentPath.endsWith('index.html') ? 'active' : ''}">Dashboard</a></li>
        <li><a href="/pages/patients.html" class="nav-link ${currentPath.includes('patients.html') ? 'active' : ''}">Patients</a></li>
        <li><a href="/pages/new_screening.html" class="nav-link ${currentPath.includes('new_screening.html') ? 'active' : ''}">New Screening</a></li>
        <li><a href="/pages/screenings.html" class="nav-link ${currentPath.includes('screenings.html') ? 'active' : ''}">Screenings Log</a></li>
      `;
    } else {
      // Not logged in or guest view
      navLinks.innerHTML = `
        <li><a href="/pages/login.html" class="nav-link ${currentPath.includes('login') ? 'active' : ''}">Portals</a></li>
        <li><a href="/pages/login-doctor.html" class="nav-link">Doctor Login</a></li>
        <li><a href="/pages/login-patient.html" class="nav-link">Patient Login</a></li>
        <li><a href="/pages/login-admin.html" class="nav-link">Admin Login</a></li>
      `;
    }

    // 2. Nav Meta area (User pill & Logout)
    if (navMeta) {
      if (user) {
        let badgeColor = "#38bdf8";
        let roleLabel = "Doctor";
        let roleBg = "rgba(56, 189, 248, 0.15)";
        let roleBorder = "rgba(56, 189, 248, 0.35)";

        if (user.role === "admin") {
          badgeColor = "#fbbf24";
          roleLabel = "Admin";
          roleBg = "rgba(251, 191, 36, 0.15)";
          roleBorder = "rgba(251, 191, 36, 0.35)";
        } else if (user.role === "patient") {
          badgeColor = "#34d399";
          roleLabel = "Patient";
          roleBg = "rgba(52, 211, 153, 0.15)";
          roleBorder = "rgba(52, 211, 153, 0.35)";
        }

        navMeta.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.75rem; border-radius: 9999px; background: ${roleBg}; border: 1px solid ${roleBorder}; font-size: 0.8rem; color: #ffffff;">
              <span style="font-weight: 700; color: ${badgeColor}; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; background: rgba(0,0,0,0.25); padding: 0.1rem 0.35rem; border-radius: 4px;">
                ${roleLabel}
              </span>
              <span style="max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">
                ${user.full_name || user.username}
              </span>
            </div>
            <button id="btn-global-logout" class="btn btn-ghost btn-sm" title="Log out of session" style="border: 1px solid var(--border-subtle); padding: 0.35rem 0.65rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Logout</span>
            </button>
          </div>
        `;

        const logoutBtn = document.getElementById("btn-global-logout");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", () => {
            const redirect = user.role === "admin" ? "/pages/login-admin.html" : (user.role === "patient" ? "/pages/login-patient.html" : "/pages/login-doctor.html");
            Auth.logout(redirect);
          });
        }
      } else {
        navMeta.innerHTML = `
          <a href="/pages/login.html" class="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Sign In</span>
          </a>
        `;
      }
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Auth.setupNavbar();
});
