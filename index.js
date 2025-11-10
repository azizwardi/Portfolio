// ---
const hamMenuBtn = document.querySelector('.header__main-ham-menu-cont')
const smallMenu = document.querySelector('.header__sm-menu')
const headerHamMenuBtn = document.querySelector('.header__main-ham-menu')
const headerHamMenuCloseBtn = document.querySelector(
  '.header__main-ham-menu-close'
)
const headerSmallMenuLinks = document.querySelectorAll('.header__sm-menu-link')

hamMenuBtn.addEventListener('click', () => {
  if (smallMenu.classList.contains('header__sm-menu--active')) {
    smallMenu.classList.remove('header__sm-menu--active')
  } else {
    smallMenu.classList.add('header__sm-menu--active')
  }
  if (headerHamMenuBtn.classList.contains('d-none')) {
    headerHamMenuBtn.classList.remove('d-none')
    headerHamMenuCloseBtn.classList.add('d-none')
  } else {
    headerHamMenuBtn.classList.add('d-none')
    headerHamMenuCloseBtn.classList.remove('d-none')
  }
})

for (let i = 0; i < headerSmallMenuLinks.length; i++) {
  headerSmallMenuLinks[i].addEventListener('click', () => {
    smallMenu.classList.remove('header__sm-menu--active')
    headerHamMenuBtn.classList.remove('d-none')
    headerHamMenuCloseBtn.classList.add('d-none')
  })
}

// ---
const headerLogoConatiner = document.querySelector('.header__logo-container')

headerLogoConatiner.addEventListener('click', () => {
  location.href = 'index.html'
})

// Contact form handling
;(function () {
  const form = document.getElementById('contactForm')
  const statusEl = document.getElementById('contact-status')
  const submitBtn = document.getElementById('contactSubmit')

  if (!form) return

  // Enhanced status: inline element (legacy) + floating toast popup
  let popupTimer = null
  const popup = document.getElementById('contact-popup')
  const popupMsg = popup ? document.getElementById('contact-popup-msg') : null
  const popupIcon = popup ? document.getElementById('contact-popup-icon') : null
  const popupClose = popup ? document.getElementById('contact-popup-close') : null

  function hidePopup() {
    if (!popup) return
    popup.classList.remove('contact-popup--show', 'contact-popup--success', 'contact-popup--error')
    popup.setAttribute('hidden', '')
    if (popupTimer) {
      clearTimeout(popupTimer)
      popupTimer = null
    }
  }

  if (popupClose) {
    popupClose.addEventListener('click', hidePopup)
  }

  function showStatus(message, isError) {
    // legacy inline status element
    if (statusEl) {
      statusEl.textContent = message
      statusEl.style.color = isError ? '#ff6b6b' : '#9ae6b4'
    }

    // popup toast
    if (!popup || !popupMsg) return
    popupMsg.textContent = message
    // icon
    if (popupIcon) popupIcon.textContent = isError ? '!' : '✓'
    popup.classList.remove('contact-popup--success', 'contact-popup--error')
    popup.classList.add(isError ? 'contact-popup--error' : 'contact-popup--success')
    popup.removeAttribute('hidden')
    // trigger show (with transition)
    window.requestAnimationFrame(() => popup.classList.add('contact-popup--show'))

    // auto-hide after 5s
    if (popupTimer) clearTimeout(popupTimer)
    popupTimer = setTimeout(() => hidePopup(), 5000)
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // simple client-side validation
    const name = form.querySelector('[name="name"]').value.trim()
    const email = form.querySelector('[name="email"]').value.trim()
    const message = form.querySelector('[name="message"]').value.trim()
    const gotcha = form.querySelector('[name="_gotcha"]').value || ''

    if (!name || !email || !message) {
      showStatus('Please fill in all required fields.', true)
      return
    }

    // disable while sending
    submitBtn.disabled = true
    submitBtn.textContent = 'Sending...'
    showStatus('Sending message...', false)

    try {
      // Determine endpoint: meta tag > /api/contact
      const meta = document.querySelector('meta[name="contact-endpoint"]')
      const endpoint = meta && meta.content ? meta.content.trim() : '/api/contact'

      const headers = { 'Content-Type': 'application/json' }
      // For external form endpoints (Formspree) include Accept header to get JSON response
      if (/^https?:\/\//.test(endpoint)) headers['Accept'] = 'application/json'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, email, message, _gotcha: gotcha })
      })

      // Try to parse JSON safely
      let data = {}
      try { data = await res.json() } catch (e) { /* ignore parse errors */ }

      // Formspree returns 200 OK with { ok: true } on success, or 422/400 with errors
      if (res.ok && (data.ok === true || res.status === 200)) {
        showStatus('Message sent — thank you!', false)
        form.reset()
      } else if (data && (data.error || data.errors)) {
        const err = data.error || (Array.isArray(data.errors) ? data.errors.map(x=>x.message||x).join(', ') : JSON.stringify(data.errors))
        showStatus(err, true)
      } else {
        showStatus('Failed to send message. Try again later.', true)
      }
    } catch (err) {
      console.error('Contact form error', err)
      showStatus('Network error. Check your connection.', true)
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Submit'
    }
  })
})()
