export default function Footer() {
  return (
    <footer className="footer">
      Footage: free sample from the{' '}
      <a href="https://unidata.pro/datasets/smoke-and-fire-detection-videos-dataset/" target="_blank" rel="noreferrer">
        Unidata Smoke and Fire Detection Videos dataset
      </a>
      . This is a demo: box positions follow the real smoke and flames in the clip, and confidence values are
      pre-computed for this video. SMS, siren, PLC and Teams alerts are simulated.
    </footer>
  );
}
