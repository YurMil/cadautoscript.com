import Footer from '@theme-original/Footer';
import React from 'react';

type FooterProps = React.ComponentProps<typeof Footer>;

export default function FooterWrapper(props: FooterProps): React.JSX.Element {
  return (
    <>
      <Footer {...props} />
      <div style={{textAlign: 'center', padding: '0.5rem 0 1rem', display: 'flex', justifyContent: 'center', gap: '1rem'}}>
        <a
          href="https://www.linkedin.com/in/yurii-milienin/"
          target="_blank"
          rel="noopener noreferrer"
          style={{display: 'inline-flex', alignItems: 'center', gap: '0.35rem'}}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.762 2.239 5 5 5h14c2.762 0 5-2.238 5-5v-14c0-2.761-2.238-5-5-5zm-11 20h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-1.337-.026-3.058-1.864-3.058-1.864 0-2.151 1.456-2.151 2.962v5.7h-3v-11h2.881v1.507h.041c.401-.761 1.379-1.562 2.838-1.562 3.035 0 3.597 2 3.597 4.599v6.456z" />
          </svg>
          LinkedIn
        </a>
        <a
          href="https://github.com/YurMil"
          target="_blank"
          rel="noopener noreferrer"
          style={{display: 'inline-flex', alignItems: 'center', gap: '0.35rem'}}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.41 7.86 10.94.58.11.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.28-1.71-1.28-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a10.8 10.8 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.21-1.5 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.82 1.19 3.07 0 4.41-2.69 5.36-5.25 5.64.41.35.77 1.04.77 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
          </svg>
          GitHub
        </a>
      </div>
    </>
  );
}
