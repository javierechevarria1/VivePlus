"use client";

import { useState, useEffect, useRef, useId, useMemo, useReducer } from "react";
import Image from "next/image";
import { useCart } from "./useCart";
import type { CartItem } from "./useCart";
import { desglosarCarrito } from "@/backend/services/tarifas-segunda-mano";
import {
  X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Package,
  ChevronLeft, MapPin, CreditCard, CheckCircle, Lock, Truck,
  User, Mail, Phone, Home, Shield,
} from "lucide-react";

const LOCAL_DEMO = process.env.NEXT_PUBLIC_LOCAL_DEMO === "true";

// Typestype Step = "cart" | "shipping" | "payment" | "success";

type ShippingData = {
  nombre: string; apellidos: string; email: string; telefono: string;
  direccion: string; ciudad: string; cp: string; notas: string;
};

type PaymentData = {
  titular: string; numero: string; expiry: string; cvv: string; metodo: "card" | "bizum" | "transferencia";
};

const EMPTY_SHIPPING: ShippingData = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "Santander",
  cp: "",
  notas: "",
};

// Datos de envío de la última compra completada, para no reescribirlos cada vez.
// Se dejan como "pendientes" antes de salir a Stripe porque la redirección
// destruye el estado de React, y solo se confirman si el pago sale bien.
const SHIPPING_KEY = "r65_shipping:v1";
const SHIPPING_PENDIENTE_KEY = "r65_shipping_pendiente";
// Marca que el pago en curso es de un artículo suelto y no del carrito, para
// que al volver de Stripe no se vacíe un carrito que sigue teniendo cosas.
export const COMPRA_DIRECTA_KEY = "r65_compra_directa";

function leerShippingGuardado(): ShippingData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SHIPPING_KEY);
    if (!raw) return null;
    const guardado = JSON.parse(raw) as Partial<ShippingData>;
    // Las notas son de un pedido concreto: no se arrastran al siguiente.
    return { ...EMPTY_SHIPPING, ...guardado, notas: "" };
  } catch {
    return null;
  }
}

function guardarShipping(datos: ShippingData) {
  try {
    localStorage.setItem(SHIPPING_KEY, JSON.stringify({ ...datos, notas: "" }));
  } catch {
    // Modo incógnito o almacenamiento lleno: el autorrelleno es opcional.
  }
}

const EMPTY_PAYMENT: PaymentData = {
  titular: "",
  numero: "",
  expiry: "",
  cvv: "",
  metodo: "card",
};

type Step = "cart" | "shipping" | "payment" | "success";

const TITLES: Record<Step, string> = {
  cart: "Tu carrito",
  shipping: "Datos de envío",
  payment: "Método de pago",
  success: "Pedido confirmado",
};

const FIELD_LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#64748B",
  marginBottom: 5,
  fontFamily: "'DM Sans', sans-serif",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const CART_TIMER_BANNER: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, background: "#FFF8E8", border: "1px solid #F5D78E", borderRadius: 10, padding: "8px 12px", marginBottom: 12 };
const CART_ORDER_ERROR_BOX: React.CSSProperties = { background: "#FFF4E6", border: "1px solid #FFBB33", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#9A6200", fontFamily: "'DM Sans', sans-serif", marginTop: 8 };
const CART_UNAVAILABLE_BANNER: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, background: "#FFF4E6", border: "1px solid #FFBB33", borderRadius: 10, padding: "10px 14px", margin: "12px 20px 0", fontSize: 12, color: "#9A6200", fontFamily: "'DM Sans', sans-serif" };
const CART_SSL_NOTE: React.CSSProperties = { textAlign: "center", marginTop: 8, fontSize: 12, color: "#94A3B8", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 };

const CART_DRAWER_STYLES = `
  .cart-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
    animation: coIn 0.25s ease both;
    border: none; padding: 0;
  }
  @keyframes coIn { from{opacity:0} to{opacity:1} }

  .cart-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 301;
    width: min(460px, 100vw); background: white;
    display: flex; flex-direction: column;
    box-shadow: -12px 0 60px rgba(0,0,0,0.15);
    animation: cdIn 0.35s cubic-bezier(0.22,1,0.36,1) both;
  }
  @keyframes cdIn { from{transform:translateX(100%)} to{transform:translateX(0)} }

  .cart-item-row {
    display: flex; gap: 14px; padding: 14px 0;
    border-bottom: 1px solid #F5F0FF;
  }
  .cart-qty-btn {
    width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid #E9D8FD;
    background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background-color .25s, color .25s, transform .25s; color: #475569;
  }
  .cart-qty-btn:hover { border-color: #EC4899; color: #EC4899; background: #FDF2F8; }

  .cart-remove-btn {
    background: none; border: none; cursor: pointer; padding: 4px;
    color: #C0B8A8; border-radius: 6px; transition: background-color .25s, color .25s, transform .25s; display: flex; align-items: center;
  }
  .cart-remove-btn:hover { color: #E74C3C; background: #FFF0F0; }

  .cart-clear-btn {
    background: none; border: none; cursor: pointer; padding: 6px 10px; border-radius: 8px;
    color: #94A3B8; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 5px;
    transition: background-color .25s, color .25s, transform .25s; font-family: 'DM Sans', sans-serif;
  }
  .cart-clear-btn:hover { color: #E74C3C; background: #FFF0F0; }

  .cart-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; padding: 40px; color: #94A3B8;
  }

  .checkout-btn {
    width: 100%; padding: 15px; border: none; border-radius: 14px;
    background: linear-gradient(135deg, #EC4899 0%, #9333EA 100%);
    color: white; font-size: 15px; font-weight: 700; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background-color .25s, color .25s, transform .25s;
    box-shadow: 0 8px 28px rgba(236,72,153,0.28);
    position: relative; overflow: hidden;
  }
  .checkout-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transform: translateX(-100%); transition: transform 0.5s ease;
  }
  .checkout-btn:hover::after { transform: translateX(100%); }
  .checkout-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(236,72,153,0.40); }
  .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .pay-method {
    padding: 12px 16px; border-radius: 12px; border: 2px solid #E9D8FD;
    cursor: pointer; transition: background-color .25s, color .25s, transform .25s; display: flex; align-items: center; gap: 12px;
    font-family: 'DM Sans', sans-serif; background: white; width: 100%; text-align: left;
  }
  .pay-method:hover { border-color: #EC4899; }
  .pay-method.selected { border-color: #EC4899; background: #FFF5F9; box-shadow: 0 0 0 3px rgba(236,72,153,0.10); }

  .step-content { animation: stepIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes stepIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }

  .success-content { animation: successIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  @keyframes successIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:none} }

  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes ping { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
  .cart-icon-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid #E9D8FD;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background-color 0.2s,color 0.2s,transform 0.2s}
  .cart-step-dot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;font-family:'DM Sans',sans-serif;transition:background-color 0.3s,color 0.3s,transform 0.3s,box-shadow 0.3s}
  .cart-item-name{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:600;color:#0F172A;margin:0 0 1px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cart-item-timer{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;margin:0 0 7px;display:flex;align-items:center;gap:3px}
  .cart-pay-icon{width:38px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .cart-pay-check{margin-left:auto;width:18px;height:18px;border-radius:50%;background:#EC4899;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .cart-stripe-info{background:#FDF2F8;padding:12px 16px;border-radius:10px;border:1px solid #FBCFE8;font-size:13px;color:#EC4899;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:10px}
  .cart-card-circle-top{position:absolute;top:-40px;right:-40px;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none}
  .cart-card-circle-bottom{position:absolute;bottom:-50px;left:-30px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.04);pointer-events:none}
  .cart-input-wrap{position:relative;width:100%}
  .cart-field-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#64748B;display:flex;pointer-events:none;z-index:1}
  .cart-card-chip{width:32px;height:24px;border-radius:5px;background:rgba(255,220,100,0.55);border:1px solid rgba(255,220,100,0.4);margin-bottom:16px;position:relative;z-index:1}
  .cart-card-number{font-family:monospace;font-size:15px;color:white;letter-spacing:0.18em;margin:0 0 14px;position:relative;z-index:1;text-shadow:0 1px 3px rgba(0,0,0,0.2)}
  .cart-delivery-info{display:flex;align-items:center;gap:8px;background:#FDF2F8;border-radius:10px;padding:10px 14px;margin-bottom:24px;width:100%}
  .cart-item-img{width:68px;height:68px;flex-shrink:0;border-radius:12px;background:#F5F2EB;overflow:hidden;position:relative}
  .cart-field-input:focus-visible{outline:2px solid #EC4899;outline-offset:2px}
`;

// Helpers
function tiempoRestante(expires_at?: string): { texto: string; urgente: boolean } | null {
  if (!expires_at) return null;
  const diff = new Date(expires_at).getTime() - Date.now();
  if (diff <= 0) return { texto: "Expirado", urgente: true };
  const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (dias > 1)  return { texto: `Expira en ${dias} días`, urgente: false };
  if (dias === 1) return { texto: "Expira mañana", urgente: true };
  return { texto: `Expira en ${horas}h`, urgente: true };
}

function precioNumero(precio: string): number {
  return parseFloat(precio.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

type Desglose = ReturnType<typeof desglosarCarrito>;

// Envío y gastos de gestión de los artículos de segunda mano, separados del
// precio: el comprador tiene que ver qué paga antes de pulsar.
function ResumenImportes({ desglose, count }: { desglose: Desglose; count: number }) {
  const fila = (etiqueta: React.ReactNode, valor: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
        {etiqueta}
      </span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#475569", fontWeight: 500 }}>
        {valor}
      </span>
    </div>
  );

  return (
    <>
      {fila(`Subtotal (${count} art.)`, `€${desglose.articulos.toFixed(2)}`)}

      {desglose.envio > 0
        ? fila(<><Truck size={11} /> Gastos de envío</>, `€${desglose.envio.toFixed(2)}`)
        : (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 5 }}>
              <Truck size={11} /> Envío
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#EC4899", fontWeight: 600 }}>
              Gratis
            </span>
          </div>
        )}

      {/* Cuánto falta para que salga gratis: es la palanca que hace que
          merezca la pena añadir algo más. */}
      {desglose.envio > 0 && desglose.faltaParaEnvioGratis > 0 && (
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "#EC4899",
          background: "#FDF2F8", borderRadius: 8, padding: "6px 9px", margin: "2px 0 7px", lineHeight: 1.45,
        }}>
          Te faltan €{desglose.faltaParaEnvioGratis.toFixed(2)} para que el envío te salga gratis.
        </div>
      )}

      {desglose.gestion > 0 &&
        fila(<><Shield size={11} /> Gastos de gestión y seguridad</>, `€${desglose.gestion.toFixed(2)}`)}
    </>
  );
}

function fmtCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function fmtExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "cart", label: "Carrito" },
  { key: "shipping", label: "Envío" },
  { key: "payment", label: "Pago" },
  { key: "success", label: "Listo" },
];

// Stepindicator
function Steps({ step }: { step: Step }) {
  const steps = STEPS;

  const idx = steps.findIndex((s) => s.key === step);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "0 4px" }}>
      {steps.map((s, i) => (
        <div
          key={s.key}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < steps.length - 1 ? 1 : "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div
              className="cart-step-dot" style={{ background: i <= idx ? "#EC4899" : "#F5F0FF", color: i <= idx ? "white" : "#94A3B8", border: i === idx ? "2.5px solid #9333EA" : "none", boxShadow: i === idx ? "0 0 0 3px rgba(236,72,153,0.15)" : "none" }}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: i === idx ? 700 : 400,
                color: i <= idx ? "#EC4899" : "#94A3B8",
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>

          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                background: i < idx ? "#EC4899" : "#F5F0FF",
                margin: "0 4px",
                marginBottom: 16,
                transition: "background 0.3s ease",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Inputcomponent
function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  half = false,
  textarea = false,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  half?: boolean;
  textarea?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const inputId = useId();

  const base: React.CSSProperties = {
    width: "100%",
    padding: textarea ? "10px 12px" : "10px 12px 10px 36px",
    border: `1.5px solid ${focused ? "#EC4899" : "#E9D8FD"}`,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    color: "#0F172A",
    background: focused ? "#FFF5F9" : "white",
    transition: "background-color 0.2s, color 0.2s, transform 0.2s",
    resize: "none" as const,
    boxSizing: "border-box" as const,
    boxShadow: focused ? "0 0 0 3px rgba(236,72,153,0.08)" : "none",
  };

  return (
    <div style={{ flex: half ? "1 1 calc(50% - 5px)" : "1 1 100%", minWidth: half ? 100 : undefined }}>
      <label htmlFor={inputId} style={FIELD_LABEL_STYLE}>
        {label}
      </label>

      <div className="cart-input-wrap">
        {icon && !textarea && (
          <span className="cart-field-icon">
            {icon}
          </span>
        )}

        {textarea ? (
          <textarea
            id={inputId}
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="cart-field-input" style={base}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="cart-field-input" style={base}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        )}
      </div>
    </div>
  );
}

// Cabecera del drawer (título, navegación de pasos, cerrar/vaciar)
function CartDrawerHeader({
  step,
  itemsLength,
  count,
  onBack,
  onClear,
  onClose,
}: {
  step: Step;
  itemsLength: number;
  count: number;
  onBack: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #F5F0FF", flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: step !== "cart" ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {step !== "cart" && step !== "success" && (
            <button
              type="button"
              aria-label="Volver"
              onClick={onBack}
              className="cart-icon-btn"
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F2EB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <ChevronLeft size={15} color="#475569" />
            </button>
          )}

          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "#FDF2F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {step === "success" ? (
              <CheckCircle size={17} color="#EC4899" />
            ) : step === "payment" ? (
              <Lock size={17} color="#EC4899" />
            ) : (
              <ShoppingBag size={17} color="#EC4899" />
            )}
          </div>

          <div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 19,
                fontWeight: 600,
                color: "#0F172A",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {TITLES[step]}
            </h2>

            {step === "cart" && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#64748B",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {count} {count === 1 ? "producto" : "productos"}
              </p>
            )}

            {step === "payment" && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#EC4899",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Lock size={9} /> Pago 100% seguro
              </p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {step === "cart" && itemsLength > 0 && (
            <button type="button" className="cart-clear-btn" onClick={onClear}>
              <Trash2 size={12} /> Vaciar
            </button>
          )}

          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="cart-icon-btn"
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F2EB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
          >
            <X size={15} color="#475569" />
          </button>
        </div>
      </div>

      {step !== "success" && step !== "cart" && <Steps step={step} />}
    </div>
  );
}

// Paso: listado del carrito
function CartStepCart({
  items,
  count,
  desglose,
  removeItem,
  updateQty,
  onContinue,
}: {
  items: CartItem[];
  count: number;
  desglose: Desglose;
  removeItem: (item: CartItem) => void;
  updateQty: (item: CartItem, delta: number) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px" }}>
        {items.length === 0 ? (
          <div className="cart-empty">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "#F5F2EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={32} color="#C0B8A8" />
            </div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                color: "#64748B",
                margin: 0,
                textAlign: "center",
              }}
            >
              Tu carrito está vacío
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#94A3B8",
                margin: 0,
                textAlign: "center",
              }}
            >
              Añade productos desde la tienda
            </p>
          </div>
        ) : (
          <>
          <div style={CART_TIMER_BANNER}>
            <span style={{ fontSize: 15 }}>⏱</span>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              color: "#7A5C00", margin: 0, fontWeight: 500,
            }}>
              Los productos se reservan <strong>24 horas</strong>. Añadir al carrito renueva el tiempo.
            </p>
          </div>
          {items.map((item, i) => (
            <div key={item.id ?? `nombre:${item.nombre}`} className="cart-item-row" style={{ animationDelay: `${i * 0.04}s` }}>
              <div
                className="cart-item-img"
              >
                <Image fill sizes="100vw" src={item.imagen} alt={item.nombre} style={{ objectFit: "contain", padding: 6 }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="cart-item-name"
                >
                  {item.nombre}
                </p>

                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "#64748B",
                    margin: "0 0 5px",
                  }}
                >
                  {item.categoria}
                </p>

                {(() => {
                  const exp = tiempoRestante(item.expires_at);
                  if (!exp) return null;
                  return (
                    <p className="cart-item-timer" style={{ color: exp.urgente ? "#C0392B" : "#64748B" }}>
                      ⏱ {exp.texto}
                    </p>
                  );
                })()}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button" aria-label="Reducir cantidad" className="cart-qty-btn" onClick={() => updateQty(item, -1)}>
                      <Minus size={10} />
                    </button>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0F172A",
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {item.cantidad}
                    </span>
                    <button type="button" aria-label="Aumentar cantidad" className="cart-qty-btn" onClick={() => updateQty(item, +1)}>
                      <Plus size={10} />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#EC4899",
                      }}
                    >
                      €{(parseFloat(item.precio.replace("€", "")) * item.cantidad).toFixed(2)}
                    </strong>
                    <button type="button" aria-label="Eliminar producto" className="cart-remove-btn" onClick={() => removeItem(item)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ padding: "14px 20px 24px", borderTop: "1px solid #F5F0FF", flexShrink: 0 }}>
          <div style={{ background: "#FAF8FF", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
            <ResumenImportes desglose={desglose} count={count} />
            <div style={{ height: 1, background: "#E8E4DC", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#0F172A", fontWeight: 600 }}>
                Total
              </span>
              <strong style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 21, color: "#EC4899", fontWeight: 700 }}>
                €{desglose.total.toFixed(2)}
              </strong>
            </div>
          </div>

          <button type="button" className="checkout-btn" onClick={onContinue}>
            Continuar al envío <ArrowRight size={15} />
          </button>

          <p
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: 12,
              color: "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Pago seguro · Devolución gratuita 30 días
          </p>
        </div>
      )}
    </>
  );
}

// Paso: datos de envío
function CartStepShipping({
  shipping,
  setS,
  errors,
  count,
  desglose,
  articulo,
  onContinue,
}: {
  shipping: ShippingData;
  setS: (k: keyof ShippingData) => (v: string) => void;
  errors: Partial<ShippingData & PaymentData>;
  count: number;
  desglose: Desglose;
  articulo?: CartItem | null;
  onContinue: () => void;
}) {
  return (
    <div className="step-content" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* En una compra suelta este es el primer paso que se ve: hay que
            recordar qué se está comprando antes de pedir la dirección. */}
        {articulo && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#FAF8FF", border: "1px solid #EDE9FE", borderRadius: 12, padding: 10, marginBottom: 2 }}>
            <div className="cart-item-img" style={{ width: 52, height: 52 }}>
              <Image fill sizes="52px" src={articulo.imagen} alt={articulo.nombre} style={{ objectFit: "contain", padding: 4 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="cart-item-name">{articulo.nombre}</p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B", margin: 0 }}>
                {articulo.categoria}
              </p>
            </div>
            <strong style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 800, color: "#EC4899" }}>
              €{desglose.articulos.toFixed(2)}
            </strong>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#FDF2F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={13} color="#EC4899" />
          </div>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#EC4899",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Datos de contacto
          </span>
        </div>


        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Field
            label="Nombre"
            icon={<User size={13} />}
            value={shipping.nombre}
            onChange={(v) => setS("nombre")(v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))}
            placeholder="María"
            half
          />
          <Field
            label="Apellidos"
            icon={<User size={13} />}
            value={shipping.apellidos}
            onChange={(v) => setS("apellidos")(v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))}
            placeholder="García López"
            half
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Field
            label="Email"
            icon={<Mail size={13} />}
            value={shipping.email}
            onChange={setS("email")}
            placeholder="maria@email.com"
            type="email"
            half
          />
          <Field
            label="Teléfono"
            icon={<Phone size={13} />}
            value={shipping.telefono}
            onChange={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, 9);
              const formatted = digits.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1 $2 $3").trim();
              setS("telefono")(formatted);
            }}
            placeholder="600 123 456"
            half
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 2 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#FDF2F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MapPin size={13} color="#EC4899" />
          </div>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#EC4899",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Dirección de entrega
          </span>
        </div>

        <Field
          label="Dirección"
          icon={<Home size={13} />}
          value={shipping.direccion}
          onChange={setS("direccion")}
          placeholder="Calle Mayor, 12, 3º B"
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Field
            label="Ciudad"
            icon={<MapPin size={13} />}
            value={shipping.ciudad}
            onChange={setS("ciudad")}
            placeholder="Santander"
            half
          />
          <Field
            label="Código postal"
            icon={<MapPin size={13} />}
            value={shipping.cp}
            onChange={(v) => setS("cp")(v.replace(/\D/g, "").slice(0, 5))}
            placeholder="39001"
            half
          />
        </div>

        <Field
          label="Notas (opcional)"
          value={shipping.notas}
          onChange={setS("notas")}
          placeholder="Instrucciones especiales para la entrega..."
          textarea
        />

        {Object.keys(errors).length > 0 && (
          <div
            style={{
              background: "#FFF0F0",
              border: "1px solid #FFCDD2",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12,
              color: "#C62828",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Por favor, completa todos los campos obligatorios.
          </div>
        )}
      </div>

      <div style={{ padding: "14px 20px 24px", borderTop: "1px solid #F5F0FF", flexShrink: 0 }}>
        {/* Aquí es donde el comprador ve por primera vez qué se le va a cobrar
            de más: el catálogo solo anuncia el precio del vendedor. */}
        <div style={{ background: "#FAF8FF", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <ResumenImportes desglose={desglose} count={count} />
          <div style={{ height: 1, background: "#E8E4DC", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0F172A", fontWeight: 600 }}>
              Total
            </span>
            <strong style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 19, color: "#EC4899", fontWeight: 700 }}>
              €{desglose.total.toFixed(2)}
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="checkout-btn"
          onClick={onContinue}
        >
          Continuar al pago <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// Paso: método de pago
// Vista previa animada de la tarjeta de crédito
function CartCardPreview({
  numero,
  titular,
  expiry,
}: {
  numero: string;
  titular: string;
  expiry: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #9333EA 0%, #EC4899 60%, #3A9A8A 100%)",
        borderRadius: 16,
        padding: "20px 22px 18px",
        position: "relative",
        overflow: "hidden",
        minHeight: 140,
      }}
    >
      <div
        className="cart-card-circle-top"
      />
      <div
        className="cart-card-circle-bottom"
      />

      <div
        className="cart-card-chip"
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(255,220,100,0.6)",
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(255,220,100,0.6)",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <p
        className="cart-card-number"
      >
        {numero || "•••• •••• •••• ••••"}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              margin: "0 0 3px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Titular
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "white",
              margin: 0,
              fontWeight: 600,
              letterSpacing: "0.03em",
            }}
          >
            {titular ? titular.toUpperCase() : "NOMBRE APELLIDOS"}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              margin: "0 0 3px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Expira
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "white",
              margin: 0,
              fontWeight: 600,
            }}
          >
            {expiry || "MM/AA"}
          </p>
        </div>
      </div>
    </div>
  );
}

function CartStepPayment({
  payment,
  setP,
  shipping,
  errors,
  orderError,
  processing,
  count,
  desglose,
  onPay,
}: {
  payment: PaymentData;
  setP: (k: keyof PaymentData) => (v: string) => void;
  shipping: ShippingData;
  errors: Partial<ShippingData & PaymentData>;
  orderError: string | null;
  processing: boolean;
  count: number;
  desglose: Desglose;
  onPay: () => void;
}) {
  return (
    <div className="step-content" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#FDF2F8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CreditCard size={13} color="#EC4899" />
          </div>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#EC4899",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Método de pago
          </span>
        </div>

        {(["card"] as const).map((m) => (
          <button
            type="button"
            key={m}
            className={`pay-method ${payment.metodo === m ? "selected" : ""}`}
            onClick={() => setP("metodo")(m)}
            style={{ border: `2px solid ${payment.metodo === m ? "#EC4899" : "#E9D8FD"}`, background: payment.metodo === m ? "#FFF5F9" : "white" }}
          >
            <div
              className="cart-pay-icon" style={{ background: payment.metodo === m ? "#FDF2F8" : "#F5F2EB" }}
            >
              {m === "card" && <CreditCard size={15} color={payment.metodo === m ? "#EC4899" : "#94A3B8"} />}
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  color: payment.metodo === m ? "#0F172A" : "#475569",
                }}
              >
                Tarjeta de crédito / débito
              </p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  color: "#64748B",
                  marginTop: 1,
                }}
              >
                Visa, Mastercard, American Express
              </p>
            </div>

            {payment.metodo === m && (
              <div
                className="cart-pay-check"
              >
                <span style={{ color: "white", fontSize: 12 }}>✓</span>
              </div>
            )}
          </button>
        ))}

        {payment.metodo === "card" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 4,
              animation: "stepIn 0.3s ease both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#FDF2F8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={13} color="#EC4899" />
              </div>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#EC4899",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Datos de la tarjeta
              </span>
            </div>

        {/* El campo de titular ya no es necesario, lo rellena el usuario en Stripe */}
            <div className="cart-stripe-info">
              <Lock size={16} />
              {LOCAL_DEMO
                ? "Pago de demostración: no introduzcas datos bancarios. Al pulsar pagar, se simulará la compra sin ningún cargo."
                : "Serás redirigido a la pasarela 100% segura de Stripe para introducir los datos de tu tarjeta."}
            </div>

            {!LOCAL_DEMO && (
              <CartCardPreview numero={payment.numero} titular={payment.titular} expiry={payment.expiry} />
            )}
          </div>
        )}

        {payment.metodo === "bizum" && (
          <div
            style={{
              background: "#FAF8FF",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 13,
              color: "#475569",
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.6,
            }}
          >
            Al confirmar, recibirás una solicitud de pago en tu app de Bizum al número{" "}
            <strong style={{ color: "#EC4899" }}>{shipping.telefono || "registrado"}</strong>.
          </div>
        )}

        {payment.metodo === "transferencia" && (
          <div
            style={{
              background: "#FAF8FF",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 13,
              color: "#475569",
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.8,
            }}
          >
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#0F172A" }}>Datos bancarios:</p>
            <p style={{ margin: "0 0 2px" }}>
              IBAN: <strong>ES76 2038 0001 1234 5678 9012</strong>
            </p>
            <p style={{ margin: "0 0 2px" }}>
              BIC: <strong>CAGLESMM</strong>
            </p>
            <p style={{ margin: 0 }}>
              Concepto: <strong>Pedido Relatia65 - {shipping.apellidos || "Apellidos"}</strong>
            </p>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div
            style={{
              background: "#FFF0F0",
              border: "1px solid #FFCDD2",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12,
              color: "#C62828",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Por favor, verifica los datos de la tarjeta.
          </div>
        )}

        {orderError && (
          <div
            style={CART_ORDER_ERROR_BOX}
          >
            {orderError}
          </div>
        )}
      </div>

      <div style={{ padding: "14px 20px 24px", borderTop: "1px solid #F5F0FF", flexShrink: 0 }}>
        <div style={{ background: "#FAF8FF", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#64748B" }}>
              Envío a: {shipping.ciudad || "Santander"}
            </span>
          </div>

          <ResumenImportes desglose={desglose} count={count} />
          <div style={{ height: 1, background: "#E8E4DC", margin: "8px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#0F172A", fontWeight: 600 }}>
              Total a pagar
            </span>
            <strong style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 21, color: "#EC4899" }}>
              €{desglose.total.toFixed(2)}
            </strong>
          </div>
        </div>

        <button type="button" className="checkout-btn" onClick={onPay} disabled={processing}>
          {processing ? (
            <>
              <svg
                className="spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Procesando pago…
            </>
          ) : (
            <>
              <Lock size={14} /> {LOCAL_DEMO ? "Simular pago" : "Pagar"} €{desglose.total.toFixed(2)}
            </>
          )}
        </button>

        {/* La ley obliga a informar del derecho de desistimiento ANTES de
            comprar, no después. Va justo debajo del botón de pagar porque es
            el último sitio donde se mira antes de decidir. */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, lineHeight: 1.6,
          color: "#64748B", margin: "10px 0 0", textAlign: "center",
        }}>
          Tienes <strong style={{ color: "#0F172A" }}>14 días para devolverlo</strong> sin dar
          explicaciones. Te devolvemos todo lo que pagas, descontando el envío de vuelta
          (4,50–7 € según el tamaño).{" "}
          <a href="/devoluciones" target="_blank" rel="noopener noreferrer" style={{ color: "#7C3AED", fontWeight: 600 }}>
            Cómo hacerlo
          </a>
        </p>

        <p
          style={CART_SSL_NOTE}
        >
          <Shield size={10} /> Cifrado SSL · Datos protegidos
        </p>
      </div>
    </div>
  );
}

// Paso: confirmación de pedido
function CartStepSuccess({
  shipping,
  payment,
  paidTotal,
  onClose,
}: {
  shipping: ShippingData;
  payment: PaymentData;
  paidTotal: number;
  onClose: () => void;
}) {
  return (
    <div
      className="success-content"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", marginBottom: 24 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "#FDF2F8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={40} color="#EC4899" />
        </div>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid #EC4899",
            animation: "ping 0.9s 0.3s ease-out 1 both",
            display: "block",
            opacity: 0,
          }}
        />
      </div>

      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26,
          fontWeight: 600,
          color: "#0F172A",
          margin: "0 0 10px",
        }}
      >
        Pedido confirmado
      </h2>

      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          color: "#64748B",
          lineHeight: 1.7,
          margin: "0 0 28px",
          maxWidth: 320,
        }}
      >
        {LOCAL_DEMO
          ? <>Demostración completada para <strong style={{ color: "#0F172A" }}>{shipping.nombre || "cliente"}</strong>. No se ha realizado ningún cargo ni se ha enviado un pedido real.</>
          : <>Gracias, <strong style={{ color: "#0F172A" }}>{shipping.nombre || "cliente"}</strong>. Hemos recibido tu pedido y recibirás una confirmación en{" "}
            <strong style={{ color: "#EC4899" }}>{shipping.email || "tu email"}</strong>.</>}
      </p>

      <div
        style={{
          background: "#FAF8FF",
          borderRadius: 14,
          padding: "16px 20px",
          width: "100%",
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            margin: "0 0 10px",
          }}
        >
          Resumen del pedido
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#475569" }}>
            Envío a
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#0F172A", fontWeight: 500 }}>
            {shipping.ciudad}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#475569" }}>
            Método de pago
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#0F172A", fontWeight: 500 }}>
            {payment.metodo === "card" ? "Tarjeta" : payment.metodo === "bizum" ? "Bizum" : "Transferencia"}
          </span>
        </div>

        <div style={{ height: 1, background: "#E8E4DC", margin: "8px 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: "#0F172A", fontWeight: 600 }}>
            {LOCAL_DEMO ? "Total de demostración" : "Total pagado"}
          </span>
          <strong style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 22, color: "#EC4899" }}>
            €{paidTotal.toFixed(2)}
          </strong>
        </div>
      </div>

      {!LOCAL_DEMO && (
        <div className="cart-delivery-info">
          <Truck size={15} color="#EC4899" />
          <p
          className="cart-delivery-info"
          >
            Entrega estimada: <strong>2-4 días hábiles</strong>
          </p>
        </div>
      )}

      <button type="button" className="checkout-btn" onClick={onClose}>
        Volver a la tienda
      </button>
    </div>
  );
}

// El paso en el que se esta, si hay cobro en curso, los errores del formulario,
// el del pedido y el total pagado no se mueven por separado: cada momento de la
// compra los cambia a la vez. Van juntos para que cada transicion se lea entera
// —«el pago fallo», «el pago se completo»— en vez de como una lista de setters.
type EstadoCheckout = {
  step: Step;
  processing: boolean;
  errors: Partial<ShippingData & PaymentData>;
  orderError: string | null;
  paidTotal: number;
};

const CHECKOUT_INICIAL: EstadoCheckout = {
  step: "cart",
  processing: false,
  errors: {},
  orderError: null,
  paidTotal: 0,
};

type AccionCheckout =
  | { type: "paso"; step: Step }
  | { type: "compraDirecta" }
  | { type: "articuloNoDisponible" }
  | { type: "errores"; errors: Partial<ShippingData & PaymentData> }
  | { type: "errorPedido"; mensaje: string }
  | { type: "pagoIniciado" }
  | { type: "pagoFallido"; mensaje: string }
  | { type: "pagoCompletado"; total: number }
  | { type: "pagoCancelado" }
  | { type: "reiniciar" };

function checkoutReducer(estado: EstadoCheckout, accion: AccionCheckout): EstadoCheckout {
  switch (accion.type) {
    case "paso":          return { ...estado, step: accion.step };
    case "compraDirecta": return { ...estado, step: "shipping", errors: {}, orderError: null };
    // El articulo ya no esta en el carrito: si se estaba tramitando la compra
    // hay que volver atras, y si no, quedarse donde se este.
    case "articuloNoDisponible":
      return estado.step === "shipping" || estado.step === "payment"
        ? { ...estado, step: "cart" }
        : estado;
    case "errores":       return { ...estado, errors: accion.errors };
    case "errorPedido":   return { ...estado, orderError: accion.mensaje };
    case "pagoIniciado":  return { ...estado, processing: true, orderError: null };
    case "pagoFallido":   return { ...estado, processing: false, orderError: accion.mensaje };
    case "pagoCompletado": return { ...estado, processing: false, step: "success", paidTotal: accion.total };
    case "pagoCancelado": return { ...estado, step: "payment", orderError: "El pago ha sido cancelado en Stripe." };
    // Al cerrar el cajon se vuelve al carrito sin arrastrar errores. El total
    // pagado se queda: solo lo lee la pantalla de compra terminada.
    case "reiniciar":     return { ...estado, step: "cart", errors: {}, orderError: null };
    default:              return estado;
  }
}

// Maincomponent
export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQty, clearCart, count } = useCart();

  const [checkout, dispatchCheckout] = useReducer(checkoutReducer, CHECKOUT_INICIAL);
  const { step, processing, errors, orderError, paidTotal } = checkout;

  const [shipping, setShipping] = useState<ShippingData>(EMPTY_SHIPPING);
  const [payment, setPayment] = useState<PaymentData>(EMPTY_PAYMENT);
  const [avisoNoDisponible, setAvisoNoDisponible] = useState<string | null>(null);

  // Compra directa: un artículo de segunda mano que se compra solo, sin pasar
  // por el carrito. Cada pieza tiene su vendedor, su envío y su propio ciclo de
  // retención, así que no se mezcla con otras compras en un mismo cobro.
  const [compraDirecta, setCompraDirecta] = useState<CartItem | null>(null);

  const lineas = useMemo(
    () => (compraDirecta ? [compraDirecta] : items),
    [compraDirecta, items]
  );
  const unidades = compraDirecta ? compraDirecta.cantidad : count;

  // Mismo cálculo que hace el checkout en servidor: el total que se enseña
  // aquí es el que va a cobrar Stripe, extras incluidos.
  const desglose = useMemo(
    () => desglosarCarrito(lineas.map(item => ({
      esSegundaMano: item.categoria === "Segunda Mano",
      precio: precioNumero(item.precio),
      cantidad: item.cantidad,
      vendedorId: item.id_vendedor ?? null,
      tamano: item.tamano_paquete ?? null,
    }))),
    [lineas]
  );

  const totalRef = useRef(desglose.total);
  useEffect(() => { totalRef.current = desglose.total; }, [desglose.total]);

  // La ficha de segunda mano pide comprar un artículo suelto: se salta el paso
  // del carrito y entra directamente en los datos de envío.
  useEffect(() => {
    const handler = (e: Event) => {
      setCompraDirecta((e as CustomEvent<CartItem>).detail);
      dispatchCheckout({ type: "compraDirecta" });
    };
    window.addEventListener("r65:comprar-ahora", handler);
    return () => window.removeEventListener("r65:comprar-ahora", handler);
  }, []);

  // Alguien compró (o el vendedor retiró) un artículo que teníamos en el carrito:
  // CartContext ya lo ha quitado, aquí solo se avisa y se vuelve al paso del carrito.
  useEffect(() => {
    const handler = (e: Event) => {
      const { nombre } = (e as CustomEvent<{ nombre: string }>).detail;
      setAvisoNoDisponible(`"${nombre}" ya no está disponible y se ha quitado de tu carrito.`);
      dispatchCheckout({ type: "articuloNoDisponible" });
    };
    window.addEventListener("relatia-item-no-disponible", handler);
    return () => window.removeEventListener("relatia-item-no-disponible", handler);
  }, []);

  useEffect(() => {
    // El scroll vertical cuelga de <html> (globals.css fija overflow-x en html),
    // así que bloquear solo body deja la página moviéndose bajo el drawer.
    if (open) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  // El snap del hero escucha wheel/touch en window y mueve la página con
  // scrollTo, que es programático y se salta el overflow:hidden de arriba.
  // Cortando la propagación en captura nunca llega a esos listeners, y como
  // no se hace preventDefault el drawer sigue scrolleando por dentro.
  useEffect(() => {
    if (!open) return;
    const frenar = (e: Event) => e.stopPropagation();
    const eventos = ["wheel", "touchstart", "touchend", "touchmove"] as const;
    for (const ev of eventos) {
      window.addEventListener(ev, frenar, { capture: true, passive: true });
    }
    return () => {
      for (const ev of eventos) {
        window.removeEventListener(ev, frenar, { capture: true });
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const guardado = leerShippingGuardado();
    if (guardado) setShipping(guardado);
  }, [open]);

  useEffect(() => {
    const handlePagoCompletado = (e: Event) => {
      const customEvent = e as CustomEvent<{ success: boolean; total?: number }>;
      const pendiente = sessionStorage.getItem(SHIPPING_PENDIENTE_KEY);
      sessionStorage.removeItem(SHIPPING_PENDIENTE_KEY);

      if (customEvent.detail.success) {
        // Por orden de fiabilidad: lo que dice Stripe, lo que se guardó al salir
        // hacia la pasarela, y por último el carrito — que a estas alturas ya
        // puede estar vacío, así que solo sirve de último recurso.
        const totalStripe = customEvent.detail.total ?? 0;
        const totalGuardado = parseFloat(sessionStorage.getItem("r65_stripe_total") ?? "0");
        sessionStorage.removeItem("r65_stripe_total");
        const totalPagado = totalStripe > 0 ? totalStripe : totalGuardado > 0 ? totalGuardado : totalRef.current;
        // La redirección a Stripe vació el formulario: se recupera para el
        // resumen del pedido y se guarda ya como datos de la próxima compra.
        if (pendiente) {
          try {
            const datos = { ...EMPTY_SHIPPING, ...(JSON.parse(pendiente) as Partial<ShippingData>) };
            setShipping(datos);
            guardarShipping(datos);
          } catch {
            // Pendiente corrupto: se sigue sin autorrelleno.
          }
        }
        dispatchCheckout({ type: "pagoCompletado", total: totalPagado });
        // Una compra suelta no toca el carrito: puede seguir teniendo artículos
        // que el comprador no ha pagado.
        if (sessionStorage.getItem(COMPRA_DIRECTA_KEY) === "1") {
          sessionStorage.removeItem(COMPRA_DIRECTA_KEY);
        } else {
          clearCart();
        }
      } else {
        dispatchCheckout({ type: "pagoCancelado" });
      }
    };

    window.addEventListener("pago-completado", handlePagoCompletado);
    return () => window.removeEventListener("pago-completado", handlePagoCompletado);
  }, [clearCart]);

  const setS = (k: keyof ShippingData) => (v: string) =>
    setShipping((p) => ({ ...p, [k]: v }));

  const setP = (k: keyof PaymentData) => (v: string) =>
    setPayment((p) => ({ ...p, [k]: v }));

  const validateShipping = () => {
    const e: Partial<ShippingData> = {};

    if (!shipping.nombre.trim()) e.nombre = "Requerido";
    if (!shipping.apellidos.trim()) e.apellidos = "Requerido";
    if (!shipping.email.trim() || !shipping.email.includes("@")) e.email = "Email inválido";

    const telefonoLimpio = shipping.telefono.replace(/\D/g, "");
    if (telefonoLimpio.length !== 9) {
      e.telefono = "El teléfono debe tener 9 dígitos";
    }

    if (!shipping.direccion.trim()) e.direccion = "Requerido";
    if (!shipping.cp.trim()) e.cp = "Requerido";

    dispatchCheckout({ type: "errores", errors: e });
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    // Eliminado el requisito de titular, ya que Stripe recoge esos datos
    dispatchCheckout({ type: "errores", errors: {} });
    return true;
  };

  const handlePay = async () => {
    if (!validatePayment()) return;

    if (sessionStorage.getItem("r65_authed") !== "true") {
      dispatchCheckout({ type: "errorPedido", mensaje: "Debes iniciar sesión para completar la compra." });
      window.dispatchEvent(new CustomEvent("r65:open-auth"));
      return;
    }

    if (!lineas.length) {
      dispatchCheckout({ type: "errorPedido", mensaje: "El carrito está vacío." });
      return;
    }

    dispatchCheckout({ type: "pagoIniciado" });

    try {
      if (LOCAL_DEMO) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        dispatchCheckout({ type: "pagoCompletado", total: desglose.total });
        if (!compraDirecta) clearCart();
        return;
      }

      if (payment.metodo === "card") {
        const direccionEnvio = [
          `${shipping.nombre} ${shipping.apellidos}`.trim(),
          shipping.direccion,
          `${shipping.cp} ${shipping.ciudad}`.trim(),
          shipping.email,
          shipping.telefono,
          shipping.notas,
        ].filter(Boolean).join(" — ");

        const response = await fetch("/api/ordenes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lineas.map(item => ({
              producto_id: item.id,
              cantidad: item.cantidad,
              descuento: 0,
            })),
            direccion_envio: direccionEnvio,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          // El producto se vendió (o se está vendiendo) mientras estaba en el carrito:
          // se saca del carrito y se refresca el catálogo antes de mostrar el motivo.
          if (Array.isArray(data.no_disponibles) && data.no_disponibles.length > 0) {
            const noDisponibles = new Set(data.no_disponibles as number[]);
            for (const item of items) {
              if (item.id !== undefined && noDisponibles.has(item.id)) removeItem(item);
            }
            window.dispatchEvent(new Event("stock-actualizado"));
          }
          throw new Error(data.error || "Error al crear la orden");
        }

        if (data.checkout_url) {
          sessionStorage.setItem("r65_stripe_total", String(desglose.total));
          sessionStorage.setItem(SHIPPING_PENDIENTE_KEY, JSON.stringify(shipping));
          // Al volver de Stripe el componente ya se ha remontado y no recuerda
          // que era una compra suelta: sin esta marca se vaciaría el carrito
          // real del comprador, que no ha comprado nada.
          if (compraDirecta) sessionStorage.setItem(COMPRA_DIRECTA_KEY, "1");
          window.location.href = data.checkout_url;
        } else {
          throw new Error("No se recibió la URL de pago.");
        }
      } else {
        // Lógica original para otros métodos de pago (Bizum, Transferencia)
        const results = await Promise.all(items.map(async item => {
          const payload = {
            id: item.id ?? undefined,
            nombre: item.nombre,
            cantidad: item.cantidad,
          };
          const response = await fetch("/api/comprar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          return { item, response, data };
        }));

        for (const { item, response, data } of results) {
          if (!response.ok || !data.ok) {
            dispatchCheckout({ type: "pagoFallido", mensaje: `No se pudo procesar "${item.nombre}": ${data.message || "Error"}` });
            return;
          }
        }

        // Se guarda el total antes de la espera: al vaciar el carrito el
        // desglose se queda a cero y la pantalla final tiene que decir lo cobrado.
        const totalCobrado = desglose.total;
        guardarShipping(shipping);
        window.dispatchEvent(new Event("stock-actualizado"));
        await new Promise((r) => setTimeout(r, 1200));
        dispatchCheckout({ type: "pagoCompletado", total: totalCobrado });
        clearCart();
      }
    } catch (error: unknown) {
      console.error("Error de compra:", error);
      dispatchCheckout({
        type: "pagoFallido",
        mensaje: error instanceof Error ? error.message : "Error de conexión. Por favor, inténtalo de nuevo.",
      });
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      dispatchCheckout({ type: "reiniciar" });
      setShipping(leerShippingGuardado() ?? EMPTY_SHIPPING);
      setPayment(EMPTY_PAYMENT);
      setAvisoNoDisponible(null);
      setCompraDirecta(null);
    }, 400);
  };

  // En una compra suelta no hay paso de carrito al que volver: desde los datos
  // de envío, atrás es salir.
  const handleBack = () => {
    if (step === "payment") return dispatchCheckout({ type: "paso", step: "shipping" });
    if (compraDirecta) return handleClose();
    dispatchCheckout({ type: "paso", step: "cart" });
  };

  const goToPayment = () => {
    if (validateShipping()) dispatchCheckout({ type: "paso", step: "payment" });
  };

  return (
    <>
      <style>{CART_DRAWER_STYLES}</style>

      {open && (
        <>
          <button type="button" className="cart-overlay" aria-label="Cerrar carrito" onClick={handleClose} onKeyDown={e => { if (e.key === "Escape") handleClose(); }} />
          <div className="cart-drawer">
            <CartDrawerHeader
              step={step}
              itemsLength={compraDirecta ? 0 : items.length}
              count={unidades}
              onBack={handleBack}
              onClear={clearCart}
              onClose={handleClose}
            />

            {avisoNoDisponible && (
              <div style={CART_UNAVAILABLE_BANNER}>
                <span style={{ fontSize: 15 }}>⚠️</span>
                <p style={{ margin: 0, flex: 1 }}>{avisoNoDisponible}</p>
                <button
                  type="button"
                  aria-label="Descartar aviso"
                  onClick={() => setAvisoNoDisponible(null)}
                  className="cart-remove-btn"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {step === "cart" && (
              <CartStepCart
                items={items}
                count={count}
                desglose={desglose}
                removeItem={removeItem}
                updateQty={updateQty}
                onContinue={() => dispatchCheckout({ type: "paso", step: "shipping" })}
              />
            )}

            {step === "shipping" && (
              <CartStepShipping
                shipping={shipping}
                setS={setS}
                errors={errors}
                count={unidades}
                desglose={desglose}
                articulo={compraDirecta}
                onContinue={goToPayment}
              />
            )}

            {step === "payment" && (
              <CartStepPayment
                payment={payment}
                setP={setP}
                shipping={shipping}
                errors={errors}
                orderError={orderError}
                processing={processing}
                count={unidades}
                desglose={desglose}
                onPay={handlePay}
              />
            )}

            {step === "success" && (
              <CartStepSuccess
                shipping={shipping}
                payment={payment}
                paidTotal={paidTotal}
                onClose={handleClose}
              />
            )}
          </div>
        </>
      )}
    </>
  );
}
