if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    speakText("Tu navegador no soporta la API de reconocimiento de voz.");
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const recipientRecognition = new SpeechRecognition();

    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = true;

    recipientRecognition.lang = 'es-ES';
    recipientRecognition.interimResults = true;

    const recipientInput = document.getElementById('recipient');
    const output = document.getElementById('output');
    const recipientImages = document.querySelectorAll('.small-image');
    const fontBoxes = document.querySelectorAll('.font-box');
    const backgroundBoxes = document.querySelectorAll('.background-box');
    const colorPicker = document.getElementById('color-picker');

    let isPaused = false;
    let finalTranscript = '';
    let selectedFont = 'Times New Roman';
    let selectedPreviewBackground = '';
	let selectedColor = 'white';

    document.addEventListener('DOMContentLoaded', () => {
        speakText("¡Bienvenido a la Carta Mágica! Elige un destinatario en una de las imágenes y comienza a escribir tu carta.");
    });

    // Función para hablar texto
    function speakText(text) {
        const speech = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();

        // Buscar y seleccionar la voz
        const selectedVoice = voices.find(voice => voice.name === "Microsoft Laura - Spanish (Spain)");
        speech.lang = 'es-MX'; // Configurar el idioma correspondiente
        window.speechSynthesis.speak(speech);
    }
	

    recognition.onerror = (event) => {
        speakText(`Ocurrió un error: ${event.error}. Por favor, verifica los permisos de micrófono.`);
    };

    recipientImages.forEach((image) => {
        image.addEventListener('click', () => {
            const recipientName = image.getAttribute('data-recipient');
            if (recipientName) {
                recipientInput.value = recipientName;
                speakText(`Has seleccionado a ${recipientName} como destinatario.`);
            } else {
                speakText("No se pudo identificar al destinatario.");
            }
        });
    });

	//Hablar tipografia y color
	fontBoxes.forEach((box) => {
        box.addEventListener('click', () => {
            selectedFont = box.getAttribute('data-font');
            output.style.fontFamily = selectedFont;
            speakText(`Tipografía cambiada a ${selectedFont}`);
        });
    });
	
    // Modificar la lógica para los fondos
	backgroundBoxes.forEach((box) => {
		box.addEventListener('click', () => {
			// Obtener el color seleccionado
			selectedColor = box.getAttribute('data-color');
			output.style.backgroundColor = selectedColor;
			
			// Al seleccionar un fondo, actualizamos la variable para el fondo del PDF
			selectedPreviewBackground = ''; // Aquí no usamos imágenes predeterminadas para el fondo
			speakText(`Estilo de fondo de color cambiada a ${selectedColor}`);
		});
	});

	// Si tienes imágenes de fondo específicas (por ejemplo, fondo1.jpg, fondo2.jpg, etc.)
	// se debe realizar lo siguiente para permitir la selección de fondos con imágenes:
	const backgroundImageOptions = document.querySelectorAll('.background-image'); // Si tienes imágenes de fondo
	backgroundImageOptions.forEach((img) => {
		img.addEventListener('click', () => {
			// Obtener la ruta de la imagen seleccionada
			selectedPreviewBackground = img.src;
			output.style.backgroundImage = `url(${selectedPreviewBackground})`; // Aplica la imagen como fondo
			speakText(`Fondo cambiado a imagen: ${img.alt}`);
		});
	});

    /*colorPicker.addEventListener('input', () => {
        //const selectedColor = colorPicker.value;
        output.style.backgroundColor = selectedColor;
        speakText(`Fondo cambiado a color ${selectedColor}`);
    });*/
	
	
	const helpButton = document.getElementById('help-btn');
	helpButton.addEventListener('click', () => {
		speakText('Elige un destinatario en una de las imágenes y comienza a escribir tu carta.');
	});
	
	// Botón Hablar
	const startButton = document.getElementById('start-btn');
	const stopButton = document.getElementById('stop-btn');
	const resetButton = document.getElementById('reset-text-btn');
	const listenButton = document.getElementById('listen-text-btn');
	const exportPdfButton = document.getElementById('export-pdf-btn');
	
	let isAlertShown = false; // Nueva bandera para evitar repetir la alerta
	let timer; // Variable para el temporizador
	let countdownTime = 30; // Tiempo de cuenta regresiva en segundos
	const timerDisplay = document.getElementById('timer-display');
	
	recipientInput.addEventListener('input', updateButtonStates);
	output.addEventListener('input', updateButtonStates);

	// Mostrar el temporizador cuando se inicie el dictado
	startButton.addEventListener('click', () => {
		recognition.start();
		isPaused = false;
		isAlertShown = false; // Reiniciar la bandera al comenzar
		speakText('El dictado ha comenzado.');
		startButton.disabled = true;
		stopButton.disabled = false;

		// Deshabilitar botones mientras se dicta
		listenButton.disabled = true;
		exportPdfButton.disabled = true;
		document.getElementById("send-email-btn").disabled = true;

		// Cambiar apariencia visual de los botones
		updateButtonStates();

		// Mostrar el temporizador en pantalla
		timerDisplay.classList.add('active');

		// Iniciar la cuenta regresiva
		countdownTime = 30;
		updateTimerDisplay();
		timer = setInterval(() => {
			countdownTime--;
			updateTimerDisplay();

			if (countdownTime <= 0) {
				clearInterval(timer); // Detener la cuenta regresiva
				recognition.stop();

				// Solo mostrar la alerta si no se ha mostrado antes
				if (!isAlertShown) {
					speakText('No detectamos voz durante 30 segundos. El dictado se ha pausado.');
					isAlertShown = true; // Establecer la bandera para evitar alertas repetidas
				}

				stopButton.disabled = true;
				startButton.disabled = false;
				timerDisplay.classList.remove('active');
			}
		}, 1000); // Actualizar cada segundo
	});

	recognition.onresult = (event) => {
		if (isPaused) return;

		let interimTranscript = '';
		for (let i = event.resultIndex; i < event.results.length; i++) {
			if (event.results[i].isFinal) {
				finalTranscript += event.results[i][0].transcript;
			} else {
				interimTranscript += event.results[i][0].transcript;
			}
		}

		output.value = finalTranscript.trim();
		if (interimTranscript) {
			output.value += ` ${interimTranscript}`;
		}

		// Reiniciar la cuenta regresiva cada vez que se detecta voz
		clearInterval(timer); // Detener la cuenta regresiva anterior
		countdownTime = 30; // Resetear el temporizador a 30 segundos
		isAlertShown = false; // Reiniciar la bandera porque se ha detectado voz
		updateTimerDisplay();
		timer = setInterval(() => {
			countdownTime--;
			updateTimerDisplay();

			if (countdownTime <= 0) {
				clearInterval(timer); // Detener la cuenta regresiva
				recognition.stop();

				// Solo mostrar la alerta si no se ha mostrado antes
				if (!isAlertShown) {
					speakText('No detectamos voz durante 30 segundos. El dictado se ha pausado.');
					isAlertShown = true; // Establecer la bandera para evitar alertas repetidas
				}

				stopButton.disabled = true;
				startButton.disabled = false;
				timerDisplay.classList.remove('active');
			}
		}, 1000); // Actualizar cada segundo
	};

	function updateTimerDisplay() {
		const minutes = Math.floor(countdownTime / 60);
		const seconds = countdownTime % 60;
		timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}


	// Botón Pausar
	stopButton.addEventListener('click', () => {
		recognition.stop();
		isPaused = true;
		clearInterval(timer);
		speakText('El dictado se ha pausado.');
		startButton.disabled = false;
		stopButton.disabled = true;
		timerDisplay.classList.remove('active'); // También ocultamos el temporizador
		// Volver a habilitar los botones si los campos están completos
		updateButtonStates();
	});

	// Botón Reiniciar
	resetButton.addEventListener('click', () => {
		finalTranscript = '';
		output.value = '';
		speakText('El texto ha sido reiniciado.');
	});

	// Botón Escuchar
	listenButton.addEventListener('click', () => {
		const textToRead = output.value;
		speakText(textToRead);
	});
	
	// Función para habilitar y deshabilitar botones
	function updateButtonStates() {
		const isSpeaking = startButton.disabled; // Comprobamos si el botón de "Hablar" está activo (es decir, dictando)

		// Lista de botones a desactivar o activar
		const buttonsToToggle = [
			listenButton,
			exportPdfButton,
			document.getElementById("send-email-btn"),
			resetButton,
			document.getElementById("open-background-modal-btn"),
			document.getElementById("estilos-container"),
			document.querySelectorAll('.background-box')
		];

		// Si el botón de "Hablar" está activo, desactivamos los demás botones
		buttonsToToggle.forEach(button => {
			if (isSpeaking) {
				button.disabled = true;
				button.style.opacity = "0.5";
				button.style.cursor = "not-allowed";
			} else {
				button.disabled = false;
				button.style.opacity = "1";
				button.style.cursor = "pointer";
			}
		});
	}
	
	document.addEventListener("DOMContentLoaded", () => {
		const startBtn = document.getElementById('start-btn');
		const stopBtn = document.getElementById('stop-btn');
		const addRecipientBtn = document.getElementById('add-btn');
		const fontOptions = document.querySelectorAll('.font-box');
		const backgroundOptions = document.querySelectorAll('.background-box');
		const recipientGallery = document.querySelector('.recipient-gallery');

		// Función para deshabilitar la personalización
		function disableCustomization() {
			addRecipientBtn.disabled = true;
			fontOptions.forEach(option => option.style.pointerEvents = 'none');
			backgroundOptions.forEach(option => option.style.pointerEvents = 'none');
			recipientGallery.style.pointerEvents = 'none';
		}

		// Función para habilitar la personalización
		function enableCustomization() {
			addRecipientBtn.disabled = false;
			fontOptions.forEach(option => option.style.pointerEvents = 'auto');
			backgroundOptions.forEach(option => option.style.pointerEvents = 'auto');
			recipientGallery.style.pointerEvents = 'auto';
		}

		// Evento para cuando el usuario empieza a hablar
		startBtn.addEventListener('click', () => {
			disableCustomization();
			stopBtn.disabled = false;
			startBtn.disabled = true; // Deshabilitar el botón de "Hablar" mientras habla
		});

		// Evento para cuando el usuario detiene el dictado
		stopBtn.addEventListener('click', () => {
			enableCustomization();
			startBtn.disabled = false; // Habilitar el botón de "Hablar" nuevamente
		});
	});

	

	// Botón Exportar a PDF con fondo y tipografía personalizada
	exportPdfButton.addEventListener('click', async () => {
		const text = output.value.trim();
		const recipient = recipientInput.value.trim();
		const date = new Date().toLocaleDateString();
	
		if (!recipient || !text) {
			speakText('Por favor, completa todos los campos antes de exportar.');
			return;
		}
	
		const { jsPDF } = window.jspdf;
		const pdf = new jsPDF();
		pdf.setFont(selectedFont);
	
		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
	
		const textMargin = 10; // Margen para el texto
		const lineHeight = 10; // Altura de línea
		let yPosition = 50; // Posición vertical inicial para el texto
	
		// Si se seleccionó un fondo de imagen
		if (selectedPreviewBackground) {
			const img = new Image();
			img.src = selectedPreviewBackground; // Fondo de imagen seleccionado
	
			img.onload = () => {
				pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pageHeight);
				pdf.setTextColor(0, 0, 0); // Color del texto
	
				// Añadir destinatario, fecha y texto con saltos de línea automáticos
				pdf.text(`Para: ${recipient}`, textMargin, yPosition);
				yPosition += lineHeight;
				pdf.text(`Fecha: ${date}`, textMargin, yPosition);
				yPosition += lineHeight;
	
				// Dividir el texto en líneas que se ajusten al ancho de la página
				const textLines = pdf.splitTextToSize(text, pageWidth - (textMargin * 2));
				pdf.text(textLines, textMargin, yPosition);
				pdf.save('mi_primera_carta_web.pdf');
			};
	
			img.onerror = () => {
				console.error('Error al cargar la imagen de fondo.');
				speakText('No se pudo cargar la imagen de fondo. Intenta nuevamente.');
			};
		} else if (selectedColor) {
			pdf.setFillColor(selectedColor);
			pdf.rect(0, 0, pageWidth, pageHeight, 'F'); // Rellena todo el fondo con el color
			pdf.setTextColor(0, 0, 0); // Color del texto
	
			// Añadir destinatario, fecha y texto con saltos de línea automáticos
			pdf.text(`Para: ${recipient}`, textMargin, yPosition);
			yPosition += lineHeight;
			pdf.text(`Fecha: ${date}`, textMargin, yPosition);
			yPosition += lineHeight;
	
			// Dividir el texto en líneas que se ajusten al ancho de la página
			const textLines = pdf.splitTextToSize(text, pageWidth - (textMargin * 2));
			pdf.text(textLines, textMargin, yPosition);
			pdf.save('mi_primera_carta_web.pdf');
		} else {
			// Si no se seleccionó un fondo con imagen, solo se pone el color
			pdf.setFillColor(255, 255, 255); // Fondo blanco por defecto
			pdf.rect(0, 0, pageWidth, pageHeight, 'F');
			pdf.setTextColor(0, 0, 0); // Color del texto
	
			// Añadir destinatario, fecha y texto con saltos de línea automáticos
			pdf.text(`Para: ${recipient}`, textMargin, yPosition);
			yPosition += lineHeight;
			pdf.text(`Fecha: ${date}`, textMargin, yPosition);
			yPosition += lineHeight;
	
			// Dividir el texto en líneas que se ajusten al ancho de la página
			const textLines = pdf.splitTextToSize(text, pageWidth - (textMargin * 2));
			pdf.text(textLines, textMargin, yPosition);
			pdf.save('mi_primera_carta_web.pdf');
		}
	});

	

    recognition.onresult = (event) => {
        if (isPaused) return;

        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        output.value = finalTranscript.trim();
        if (interimTranscript) {
            output.value += ` ${interimTranscript}`;
        }
    };

    recipientInput.addEventListener('input', () => {
        const recipient = recipientInput.value.trim() || '[Destinatario]';
        const date = new Date().toLocaleDateString();
        const text = output.value.trim() || 'Escribe tu carta aquí...';

        document.getElementById('preview-recipient-name').textContent = recipient;
        document.getElementById('preview-date').textContent = `Fecha: ${date}`;
        document.getElementById('preview-text').textContent = text;
    });

    output.addEventListener('input', () => {
        const recipient = recipientInput.value.trim() || '[Destinatario]';
        const date = new Date().toLocaleDateString();
        const text = output.value.trim() || 'Escribe tu carta aquí...';

        document.getElementById('preview-recipient-name').textContent = recipient;
        document.getElementById('preview-date').textContent = `Fecha: ${date}`;
        document.getElementById('preview-text').textContent = text;
    });
	
	// Botón Añadir Destinatario
	document.getElementById("add-btn").addEventListener("click", function() {
        document.getElementById("addRecipientModal").style.display = "block";
    });

	document.getElementById("close-modal-btn").addEventListener("click", function() {
		document.getElementById("addRecipientModal").style.display = "none";
	});

	document.getElementById("save-recipient-btn").addEventListener("click", function() {
		const name = document.getElementById("new-name").value;
		const email = document.getElementById("new-email").value;
		const genderPic = document.querySelector('input[name="gender-pic"]:checked')?.value;

		if (name && email && genderPic) {
			recipientInput.value = name;
			alert(`Destinatario añadido: ${name}, Correo: ${email}`);

			// Crear el contenedor para la imagen y el nombre
			const recipientContainer = document.createElement('div');
			recipientContainer.classList.add('recipient-container');

			// Crear la imagen
			const newImage = document.createElement('img');
			newImage.src = genderPic;

			newImage.alt = name;
			newImage.setAttribute('data-recipient', name);
			newImage.classList.add('small-image');

			// Crear el nombre
			const recipientName = document.createElement('span');
			recipientName.textContent = name;
			recipientName.classList.add('recipient-name');

			// Agregar la imagen y el nombre al contenedor
			recipientContainer.appendChild(newImage);
			recipientContainer.appendChild(recipientName);

			// Agregar el contenedor a la galería
			document.querySelector('.recipient-gallery').appendChild(recipientContainer);

			// Evento de clic para seleccionar el destinatario
			newImage.addEventListener('click', () => {
				recipientInput.value = name;
				speakText(`Has seleccionado a ${name} como destinatario.`);
			});

			// Cerrar el modal
			document.getElementById("addRecipientModal").style.display = "none";
		} else {
			alert("Por favor completa todos los campos.");
		}
	});

	// Lógica para mostrar la ventana emergente de fondos
        const openBackgroundModalBtn = document.getElementById('open-background-modal-btn');
        const backgroundModal = document.getElementById('backgroundModal');
        const closeBackgroundModalBtn = document.getElementById('close-background-modal-btn');
        
        openBackgroundModalBtn.addEventListener('click', () => {
            backgroundModal.style.display = 'block';
        });
        
        backgroundModal.addEventListener('click', () => {
            backgroundModal.style.display = 'none';
        });
}



// Agregar esta llamada cuando añadas un nuevo destinatario
document.getElementById("save-recipient-btn").addEventListener("click", function() {
    const name = document.getElementById("new-name").value;
    const email = document.getElementById("new-email").value;
    const genderPic = document.querySelector('input[name="gender-pic"]:checked')?.value;

    if (name && email && genderPic) {
        const newRecipient = {
            name: name,
            email: email,
            pic: genderPic
        };

        const recipients = JSON.parse(localStorage.getItem('destinatarios')) || [];
        recipients.push(newRecipient);
        localStorage.setItem('destinatarios', JSON.stringify(recipients));

        guardarDestinatarios(recipients);

        // Lógica para agregar destinatario a la galería
        const recipientContainer = document.createElement('div');
        recipientContainer.classList.add('recipient-container');

        const newImage = document.createElement('img');
        newImage.src = genderPic;
        newImage.alt = name;
        newImage.setAttribute('data-recipient', name);
        newImage.classList.add('small-image');

        const recipientName = document.createElement('span');
        recipientName.textContent = name;
        recipientName.classList.add('recipient-name');

        recipientContainer.appendChild(newImage);
        recipientContainer.appendChild(recipientName);

        document.querySelector('.recipient-gallery').appendChild(recipientContainer);

        newImage.addEventListener('click', () => {
            document.getElementById('recipient').value = name;
            speakText(`Has seleccionado a ${name} como destinatario.`);
        });

        // Cerrar el modal
        document.getElementById("addRecipientModal").style.display = "none";
    } else {
        alert("Por favor completa todos los campos.");
    }
});


// Función para cargar destinatarios al cargar la página
function cargarDestinatarios() {
    const destinatarios = JSON.parse(localStorage.getItem('destinatarios')) || [];
    destinatarios.forEach(destinatario => {
        // Lógica para agregar destinatarios a la galería
        const recipientContainer = document.createElement('div');
        recipientContainer.classList.add('recipient-container');

        const newImage = document.createElement('img');
        newImage.src = destinatario.pic;
        newImage.alt = destinatario.name;
        newImage.setAttribute('data-recipient', destinatario.name);
        newImage.classList.add('small-image');

        const recipientName = document.createElement('span');
        recipientName.textContent = destinatario.name;
        recipientName.classList.add('recipient-name');

        recipientContainer.appendChild(newImage);
        recipientContainer.appendChild(recipientName);

        document.querySelector('.recipient-gallery').appendChild(recipientContainer);

        newImage.addEventListener('click', () => {
            document.getElementById('recipient').value = destinatario.name;
            speakText(`Has seleccionado a ${destinatario.name} como destinatario.`);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    cargarDestinatarios();
});



function guardarDestinatarios(destinatarios) {
    localStorage.setItem('destinatarios', JSON.stringify(destinatarios));
}






/*

//Envio a correo electronico
document.getElementById("send-email-btn").addEventListener("click", function() {
    const recipientEmail = document.getElementById("new-email").value;
    const recipientName = document.getElementById("recipient").value;

    if (!recipientEmail) {
        speakText('Por favor, agrega una dirección de correo válida para el destinatario.');
        return;
    }

    capturarCartaComoPNG().then(imagenDataURL => {
        enviarCorreoConImagen(recipientEmail, recipientName, imagenDataURL);
    });
});*/


// Variable global para guardar el correo electrónico
let savedEmail = "";

document.getElementById("send-email-btn").addEventListener("click", function () {
    // Obtener el correo y el nombre del destinatario
    const recipientEmail = document.getElementById("new-email").value.trim();
    const recipientName = document.getElementById("recipient").value.trim();

    // Validar que el correo no esté vacío y sea válido
    if (!isValidEmail(recipientEmail)) {
        speakText('Por favor, agrega una dirección de correo válida para el destinatario.');
        return;
    }

    // Guardar el correo en localStorage (opcional)
    localStorage.setItem("recipientEmail", recipientEmail);

    // Confirmar los datos en la consola
    console.log(`Correo ingresado: ${recipientEmail}`);
    console.log(`Nombre del destinatario: ${recipientName}`);

    // Continuar con el flujo de envío
    capturarCartaComoPNG().then(imagenDataURL => {
        enviarCorreoConImagen(recipientEmail, recipientName, imagenDataURL);
    });
});

// Función para validar correos electrónicos
function isValidEmail(email) {
    // Patrón de expresión regular para validar correos
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}


// Opción: Recuperar el correo desde localStorage cuando sea necesario
const previousEmail = localStorage.getItem("recipientEmail");
if (previousEmail) {
    console.log(`Correo recuperado de localStorage: ${previousEmail}`);
}







		function capturarCartaComoPNG() {
			const cartaElement = document.querySelector('.carta');
			return html2canvas(cartaElement, {
				useCORS: true,
				allowTaint: true
			}).then(canvas => {
				return canvas.toDataURL('image/png');
			});
		}

		function enviarCorreoConImagen(destinatario, nombreDestinatario, imagenDataURL) {
			emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
				to_email: destinatario,
				to_name: nombreDestinatario,
				message: 'Aquí tienes tu carta mágica',
				attachment: imagenDataURL // Enviar la imagen como base64
			}).then(response => {
				console.log('Correo enviado', response.status, response.text);
				speakText('Tu carta ha sido enviada por correo.');
			}).catch(err => {
				console.error('Error al enviar el correo', err);
				speakText('Hubo un error al enviar el correo. Por favor, inténtalo de nuevo.');
			});
		}
				
 