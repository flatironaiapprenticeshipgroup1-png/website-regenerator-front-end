"use client";

const KEY = "wr-signed-out";

export function markSignedOut() {
  localStorage.setItem(KEY, "1");
}

export function clearSignedOut() {
  localStorage.removeItem(KEY);
}

export function isSignedOut() {
  return localStorage.getItem(KEY) === "1";
}
