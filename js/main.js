function main(document) {
  const page = document;

  setMessage('Hello');

  page.body.classList.remove('nojs');

  function displayContent() {
    page.querySelectorAll('.hide').forEach(item => item.classList.remove('hide'));
    page.querySelector('#loader').classList.add('hide');
  }

  function fingerprintReport() {
    const startDate = new Date();

    Fingerprint2.get((components) => {
      const fingerprint = Fingerprint2.x64hash128(components.map(pair => pair.value).join(), 31);
      const endDate = new Date();
      const elapsedTime = endDate - startDate;

      let details = '';
      components.forEach((object) => {
        details += `${object.key} = ${String(object.value).substr(0, 50)}`;
      });

      page.querySelector('#elapsedTime').textContent = elapsedTime;
      page.querySelector('#fp').textContent = fingerprint;
      page.querySelector('#details').textContent = details;

      fetch('https://api.ipify.org?format=json', { method: 'GET' })
        .then((ipCheckResponse) => {
          if (!ipCheckResponse.ok) {
            throw new Error('Something went wrong on api server while running ipCheck!');
          } else {
            return ipCheckResponse.json();
          }
        })
        .then((ipCheckResponse) => {
          fetch('https://api.nemezisproject.co.uk/v1/api/fingerprints', {
            method: 'POST',
            headers: {
              'Authorization': 'Token 12345',
              'Content-type': 'application/json',
            },
            body: JSON.stringify([
              {
                'fingerprint': fingerprint,
                'ip_address': ipCheckResponse.ip,
                'metadata': JSON.stringify(components),
              },
            ]),
          })
            .then((createFingerprintResponse) => {
              if (!createFingerprintResponse.ok) {
                throw new Error('Something went wrong on api server while creating fingerprint!');
              } else {
                return createFingerprintResponse.json();
              }
            })
            .then((createFingerprintResponse) => {
              const isReturning = createFingerprintResponse.filter(
                obj => Object.entries(obj).length !== 0 && obj.constructor === Object,
              ).length === 0;

              if (isReturning) {
                setMessage('Welcome back ?');
              }

              displayContent();

            }).catch((createFingerprintError) => {
              throw new Error(`Something went wrong while creating fingerprint: ${createFingerprintError}`);
            });
        }).catch((ipCheckError) => {
          throw new Error(`Something went wrong: ${ipCheckError}`);
        });
    });
  }

  function setMessage (message) {
    page.querySelector('#message').textContent = message;
  }

  function supportsVideo() {
    return !!page.createElement('video').canPlayType;
  }

  function supportsOGGTheoraVideo() {
    if (!supportsVideo()) {
      return false;
    }
    return page.createElement('video').canPlayType('video/ogg; codecs="theora, vorbis"');
  }

  function supportsH264BaselineVideo() {
    if (!supportsVideo()) {
      return false;
    }
    return page.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
  }

  function createSource(src, type) {
    const source = page.createElement('source');
    source.src = src;
    source.type = type;
    return source;
  }

  function loadVideo() {
    if (supportsVideo()) {
      const video = page.getElementById('video');
      if (video) {
        if (supportsH264BaselineVideo()) {
          video.insertBefore(createSource('/assets/video/afjapan_iss_20130104HD_web2.mp4', 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'), video.firstChild);
        } else if (supportsOGGTheoraVideo()) {
          video.insertBefore(createSource('/assets/video/afjapan_iss_20130104HD_web2.ogv', 'video/ogg; codecs="theora, vorbis"'), video.firstChild);
        }
        video.play();
      }
    }
  }

  loadVideo();
  requestIdleCallback(fingerprintReport);
}
