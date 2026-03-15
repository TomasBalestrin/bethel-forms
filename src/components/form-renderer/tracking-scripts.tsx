'use client'

import Script from 'next/script'

interface TrackingScriptsProps {
  pixelId?: string
  gaId?: string
  gtmId?: string
}

export function TrackingScripts({ pixelId, gaId, gtmId }: TrackingScriptsProps) {
  return (
    <>
      {/* Meta Pixel */}
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* Google Analytics */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtmId && (
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}
        </Script>
      )}
    </>
  )
}

// Helper to fire tracking events
export function fireTrackingEvent(
  eventName: string,
  data?: Record<string, any>,
  tracking?: { pixelId?: string; gaId?: string }
) {
  // Meta Pixel event
  if (tracking?.pixelId && typeof window !== 'undefined' && (window as any).fbq) {
    if (eventName === 'FormFlowConversion') {
      ;(window as any).fbq('trackCustom', 'FormFlowConversion', data)
    } else {
      ;(window as any).fbq('trackCustom', eventName, data)
    }
  }

  // GA4 event
  if (tracking?.gaId && typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', eventName.toLowerCase(), data)
  }
}
