import { Cloud, CreditCard, LogOut, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { getCloudConfig } from "../lib/cloudConfig.js";
import { getSupabaseClient } from "../lib/supabaseClient.js";

export function CloudAccountPanel({ onSessionChange }) {
  const config = getCloudConfig();
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState("");
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      onSessionChange?.(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      onSessionChange?.(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, [onSessionChange, supabase]);

  async function handleSignIn(event) {
    event.preventDefault();
    if (!supabase || !email.trim()) return;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setMessage(error ? error.message : "登录链接已发送，请查收邮箱。");
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage("");
  }

  async function handleCheckout() {
    if (!supabase || !session?.user) return;
    if (!config.isBillingConfigured) {
      setMessage("请先配置 VITE_STRIPE_PRICE_ID 和 Stripe 相关 Edge Function secrets。");
      return;
    }

    const { data, error } = await supabase.functions.invoke("create-checkout-session");

    if (error || !data?.url) {
      setMessage(error?.message ?? "创建支付会话失败。");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <section className="panel cloud-account-panel">
      <div className="panel-header">
        <div>
          <h2>云端账户</h2>
          <p className="muted">Supabase Auth + Edge Functions + Stripe</p>
        </div>
        <Cloud size={22} />
      </div>

      {!config.isSupabaseConfigured ? (
        <div className="cloud-empty">
          <strong>当前是本地演示模式</strong>
          <p>配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 后启用登录、云端数据和支付。</p>
        </div>
      ) : session ? (
        <div className="cloud-session">
          <div>
            <span>已登录</span>
            <strong>{session.user.email}</strong>
          </div>
          <div className="cloud-actions">
            <button onClick={handleCheckout} type="button">
              <CreditCard size={15} />
              订阅
            </button>
            <button onClick={handleSignOut} type="button">
              <LogOut size={15} />
              退出
            </button>
          </div>
        </div>
      ) : (
        <form className="cloud-login-form" onSubmit={handleSignIn}>
          <label>
            <span>邮箱</span>
            <input
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
          <button type="submit">
            <Mail size={15} />
            发送登录链接
          </button>
        </form>
      )}

      {message ? <p className="cloud-message">{message}</p> : null}
    </section>
  );
}
