import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { DataSource } from 'typeorm';
import { envs } from '../config';
import { FaqEmbedding } from '../nexo/entities/faq-embedding.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  ...(envs.databaseUrl
    ? { url: envs.databaseUrl, ssl: { rejectUnauthorized: true } }
    : {
        host: envs.dbHost,
        port: parseInt(envs.dbPort, 10),
        username: envs.dbUsername,
        password: envs.dbPassword,
        database: envs.dbDatabase,
      }),
  entities: [FaqEmbedding],
  synchronize: false,
  logging: false,
});

const openai = new OpenAI({
  apiKey: envs.openAIApiKey,
});

const questions = [
  {
    question: '¿Qué es Conexia?',
    answer:
      'Conexia es una plataforma que conecta personas, servicios digitales y proyectos en un mismo lugar. Permite que profesionales, estudiantes y emprendedores colaboren, ofrezcan servicios y formen equipos de trabajo.',
  },
  {
    question: '¿Cómo creo mi perfil?',
    answer:
      'Cuando te registrás como usuario, automáticamente se te direcciona al formulario de creación de perfil, donde podés completar tus datos personales, experiencia, habilidades, ubicación y foto. También podés agregar redes, experiencias, educación y certificaciones.',
  },
  {
    question: '¿Qué son los proyectos en Conexia?',
    answer:
      'Los proyectos son el corazón colaborativo de Conexia. Permiten que los usuarios publiquen ideas o iniciativas y encuentren personas que deseen sumarse como colaboradores. Cada proyecto puede incluir descripción, habilidades requeridas, categoría y más detalles para facilitar la conexión de perfiles compatibles.',
  },
  {
    question: '¿Qué son los servicios digitales en Conexia?',
    answer:
      'Son ofertas de trabajo independiente donde un usuario ofrece un servicio digital. Pueden ser de cualquier área digital: desarrollo, diseño, redacción, marketing, soporte técnico, entre otros. Cada servicio publicado puede ser consultado, contratado y calificado dentro del ecosistema de Conexia.',
  },
  {
    question: '¿Qué es la comunidad en Conexia?',
    answer:
      'La comunidad es el espacio social de Conexia, donde los usuarios pueden interactuar, compartir ideas, mostrar sus proyectos y generar vínculos profesionales. Funciona como una red social enfocada en la colaboración, la visibilidad del talento y la creación de oportunidades.',
  },
  {
    question: '¿Dónde puedo dejar una reseña?',
    answer:
      'Podés dejar reseñas sobre:\n- Servicios contratados\n- Colaboradores de un proyecto',
  },
  {
    question: '¿Cómo agrego un método de cobro?',
    answer:
      'Desde Configuración → Métodos de cobro → Agregar método. Completá:\n- Tipo de cuenta (bancaria o billetera digital)\n- Banco o entidad\n- Alias\n- CBU\n- Titular\n- CUIL/CUIT',
  },
  {
    question: '¿Qué métricas puedo ver?',
    answer:
      'Los usuarios pueden visualizar estadísticas sobre:\n- Servicios ofrecidos\n- Proyectos publicados\n- Publicaciones\n- Postulaciones realizadas',
  },
  {
    question: '¿Cómo se verifica mi identidad?',
    answer:
      'Desde configuraciones → Verificación puedes validar tu identidad subiendo una imagen de tu documento de identificación y una imagen de tu rostro (o eventualmente reconocimiento facial)',
  },
  {
    question: '¿Cómo contacto al soporte de Conexia?',
    answer:
      'Desde la sección Ayuda o Soporte, o escribiendo a soporte@conexia.com.',
  },
  {
    question: '¿Qué puedo hacer en Conexia?',
    answer:
      '- Crear un perfil profesional.\n- Publicar proyectos y buscar colaboradores o participar en otros proyectos.\n- Ofrecer y contratar servicios digitales.\n- Conectarte con otros usuarios, enviar mensajes y comentar publicaciones.\n- Calificar, reseñar y reportar contenido.',
  },
  {
    question: '¿Cómo modifico mi perfil?',
    answer:
      'Entrá a tu perfil y seleccioná "Editar". Podés actualizar cualquier campo, incluso tus habilidades o categorías.',
  },
  {
    question: '¿Cómo publico un proyecto?',
    answer:
      'En la sección "Proyectos" → "Publicar proyecto". Completás los siguientes campos:\n- Título\n- Descripción detallada\n- Categoría\n- Habilidades requeridas\n- Plazo del proyecto (Opcional)\n- Tipo de colaboración (Remunerada, voluntaria o a definir)\n- Tipo de contrato (Remoto, híbrido o presencial)\n- Nro máximo de colaboradores\n- Imagen representativa (opcional)',
  },
  {
    question: '¿Cómo creo un servicio?',
    answer:
      'Desde la sección "Servicios" → "Publicar servicio". Indicás título, descripción, categoría, precio, tiempo estimado e imagen/es de muestra.',
  },
  {
    question: '¿Qué puedo publicar?',
    answer:
      'Desde "Comunidad → Crear publicación", podés publicar:\n- Novedades sobre tus proyectos o servicios.\n- Logros profesionales o colaboraciones destacadas.\n- Contenido relacionado con el mundo digital o tecnológico.\nLas publicaciones admiten texto, imágenes y enlaces.',
  },
  {
    question: '¿Cómo funcionan las calificaciones?',
    answer:
      'Se califica con hasta 5 estrellas y un comentario. El receptor puede responder, y otros usuarios pueden visualizar las reseñas para decidir en quién confiar.',
  },
  {
    question: '¿Es obligatorio?',
    answer:
      'No para quienes solo navegan o publican contenido. Sí para quienes interactúan con proyectos o servicios, es decir publicar, postularse, contratar, recibir pagos, etc.',
  },
  {
    question: '¿El chatbot puede resolver mis dudas?',
    answer:
      'Sí, el asistente virtual puede responder preguntas sobre el uso de la plataforma, ayudarte a publicar, configurar tu cuenta o resolver dudas frecuentes sobre proyectos y servicios.',
  },
  {
    question: '¿Puedo tener más de un perfil?',
    answer:
      'No. Cada usuario tiene un único perfil profesional, pero puede participar en varios proyectos o brindar distintos servicios.',
  },
  {
    question: '¿Cómo consulto los servicios disponibles?',
    answer:
      'En la sección "Servicios" podés ver todos los servicios publicados. Podés filtrar por:\n- Categoría\n- Habilidad\n- Precio',
  },
  {
    question: '¿Dónde veo las publicaciones de otros usuarios?',
    answer:
      'En la sección "Comunidad", vas a encontrar el feed de publicaciones, donde se muestran los posts de las personas. En cada publicación podés:\n💬 Comentar: dejar un mensaje público visible para todos.\n❤️ Reaccionar: dar "Me gusta" u otras reacciones.',
  },
  {
    question: '¿Cómo se transfieren los pagos?',
    answer:
      'El dinero se envía automáticamente a tu cuenta principal cuando el cliente realiza la acción correspondiente según el tipo de pago. Podés cambiar tu cuenta principal en cualquier momento.',
  },
  {
    question: '¿Olvidé mi contraseña, qué hago?',
    answer:
      'Desde la pantalla de inicio seleccioná "¿Olvidaste tu contraseña?". Ingresá tu correo y recibirás un enlace para restablecerla. El enlace tiene una validez de 24 horas. Tu nueva contraseña debe cumplir los mismos requisitos que en el registro.',
  },
  {
    question: '¿Cómo consulto los proyectos disponibles?',
    answer:
      'En la sección "Proyectos", podés buscar proyectos por filtros o palabras clave. Los filtros incluyen:\n- Categoría\n- Habilidades requeridas\n- Tipo de colaboración\n- Tipo de contrato\nDesde el detalle de cada proyecto se puede ver toda la información y postularse.',
  },
  {
    question: '¿Puedo editar o dar de baja un servicio?',
    answer:
      'Sí. Desde "Mis servicios", cada publicación realizada tiene las opciones:\n✏️ Editar → para actualizar precio y unidad de tiempo\n❌ Dar de baja → el servicio deja de mostrarse en las búsquedas.\nEl dueño puede visualizar servicios dados de baja.',
  },
  {
    question: '¿Puedo editar o eliminar mis publicaciones?',
    answer:
      'Sí, desde tu perfil → Mi actividad podés:\n✏️ Editar: podés modificar el texto, agregar o eliminar imágenes, y actualizar el contenido.\n🗑️ Eliminar: si ya no querés que una publicación sea visible, podés borrarla permanentemente.',
  },
  {
    question: '¿Qué pasa si hay un conflicto?',
    answer:
      'El cliente puede abrir un reclamo antes o después de confirmar la entrega y el equipo de Conexia lo revisará.',
  },
  {
    question: '¿Puedo dar de baja mi cuenta?',
    answer:
      'Sí. Desde Configuraciones → Cuenta → Dar de baja, podés eliminar tu cuenta. El sistema te pedirá confirmación antes de continuar. Al hacerlo:\n- Se cierra tu sesión automáticamente.\n- Tu perfil y tus servicios o proyectos quedan marcados como inactivos.\n- Se registra la baja con fecha y motivo (opcional).\n- No podrás volver a iniciar sesión con esa cuenta.',
  },
  {
    question: '¿Puedo editar o dar de baja un proyecto?',
    answer:
      'No podés editar un proyecto, pero sí podés darlo de baja en cualquier momento. En caso de equivocarte, deberás eliminarlo y publicarlo nuevamente.',
  },
  {
    question: '¿Cómo contrato un servicio?',
    answer:
      'Desde el detalle de un servicio, seleccioná "Solicitar cotización" e indica tus necesidades para que el dueño del servicio pueda cotizar. El proveedor recibirá la solicitud y podrá responder con una cotización personalizada.',
  },
  {
    question: '¿Cómo funciona la recomendación de conexiones?',
    answer:
      'El sistema sugiere perfiles que podrían interesarte en base a Conexiones en común. Podés ver las recomendaciones en "Comunidad → Recomendaciones" y enviar solicitudes directamente desde ahí.',
  },
  {
    question: '¿Qué medidas de seguridad se aplican?',
    answer:
      '- Verificación por correo electrónico y validación del DNI.\n- Contraseñas robustas y cifradas.\n- Bloqueo temporal tras múltiples intentos fallidos.\n- Posibilidad de recuperar acceso mediante correo verificado.',
  },
  {
    question: '¿Cómo me postulo a un proyecto?',
    answer:
      'Desde la vista de detalle del proyecto → "Postularme", te permite subir tu CV. El creador del proyecto puede aceptar, rechazar o cancelar postulaciones.',
  },
  {
    question: '¿Cómo se manejan las cotizaciones?',
    answer:
      '- Cancelar cotización: Se puede cancelar antes de que el proveedor envíe la cotización.\n- Aprobar cotización: El cliente acepta la propuesta del proveedor.\n- Rechazar cotización: Si no está conforme, puede rechazarla.\n- Negociar cotización: Si el cliente no está conforme, puede negociar con el proveedor.\nUna vez aprobada, el sistema crea el contrato correspondiente y habilita los pagos.',
  },
  {
    question: '¿Cómo envío una solicitud de conexión?',
    answer:
      'Podés hacerlo desde el perfil de un usuario o desde las recomendaciones, seleccioná "Conectar". La persona recibirá una notificación y podrá:\n✅ Aceptar: se crea la conexión y ambos podrán verse como contactos.\n❌ Rechazar: la solicitud se descarta sin crear vínculo.\n🔄 Cancelar: podés cancelar una solicitud enviada antes de que sea respondida.',
  },
  {
    question: '¿Cómo funciona el sistema de recomendaciones de proyectos?',
    answer:
      'El sistema analiza las habilidades que tenés cargadas en tu perfil y en base a eso recomienda los proyectos que tengan coincidencias en las habilidades requeridas. Realiza la recomendación ordenada por mayor cantidad de coincidencias.',
  },
  {
    question: '¿Cómo funcionan los pagos?',
    answer:
      'Cuando se realiza una cotización, hay dos opciones:\n- Pago único: Se cobra el 25% al confirmar la cotización e iniciar y el 75% restante cuando se confirma la entrega.\n- Por hitos: Cada entrega tiene un pago independiente que se libera cuando el cliente confirma su recepción.',
  },
  {
    question: '¿Cómo envío un mensaje privado a otro usuario?',
    answer:
      'Podés iniciar una conversación desde:\n- El perfil del usuario, seleccionando "Enviar mensaje".\n- El componente de mensajería flotante.\n- El icono de mensaje en la barra de navegación, al lado del icono del perfil.\nEl chat es en tiempo real y admite texto, emojis e imágenes.',
  },
  {
    question: '¿Puedo reportar un proyecto?',
    answer:
      'Sí. Si un proyecto tiene contenido inapropiado, información falsa o incumple las normas de la comunidad, podés reportarlo desde el detalle del proyecto. El equipo de soporte revisará el caso y tomará las acciones necesarias.',
  },
  {
    question: '¿Dónde recibo los pagos?',
    answer:
      'Desde Configuración → Métodos de cobro, el usuario puede registrar:\n- Cuentas bancarias (CBU/Alias, Banco, Titular, CUIT/CUIL)\n- Billeteras digitales\nUna cuenta puede marcarse como principal, que será la que reciba todos los pagos. Podés cambiar la cuenta principal en cualquier momento.',
  },
  {
    question: '¿Dónde veo mis conversaciones anteriores?',
    answer:
      'Podés encontrar tus conversaciones anteriores a través de:\n- El componente de mensajería flotante.\n- El icono de mensaje en la barra de navegación, al lado del icono del perfil.',
  },
  {
    question: '¿Qué pasa cuando me aceptan en un proyecto?',
    answer:
      'El proyecto se actualiza y ambos usuarios reciben un correo confirmando la participación. Luego la comunicación entre el dueño y el/los colaboradores del proyecto corre por su cuenta.',
  },
  {
    question: '¿Qué hacer si surge un problema con un servicio?',
    answer:
      'Tanto el cliente como el proveedor pueden realizar un reclamo si consideran algún incumplimiento por la otra parte. Soporte está gestionando la resolución del reclamo directamente desde la plataforma.',
  },
  {
    question: '¿Cómo puedo ver todos mis contactos?',
    answer:
      'En tu perfil → Mis conexiones, se muestran todas tus conexiones activas. Desde allí podés consultar su perfil y ver sus publicaciones, proyectos, enviar mensajes directos o incluso eliminar la conexión si lo deseas.',
  },
  {
    question: '¿Cómo se fomenta la seguridad y transparencia en los proyectos?',
    answer:
      'Cada usuario cuenta con identidad verificada. Al publicar un proyecto, una IA analiza el contenido y lo bloquea si no corresponde. Se registran las acciones importantes (postulaciones, aprobaciones, bajas). Los proyectos pueden ser reportados o moderados. El historial de reseñas sobre el dueño del proyecto o integrantes es público.',
  },
  {
    question: '¿Puedo reportar un servicio?',
    answer:
      'Sí. Si encontrás un servicio que incumple las normas (contenido inapropiado, estafa, etc.), podés reportarlo desde el detalle del servicio, opción "Reportar servicio". El equipo de Conexia revisará el caso y tomará las medidas necesarias.',
  },
  {
    question: '¿Puedo reportar una publicación o comentario?',
    answer:
      'Sí. Si detectás contenido inapropiado, ofensivo o que incumple las normas de Conexia, podés reportarlo desde los tres puntitos → Reportar publicación. El equipo de moderación revisará el caso y tomará medidas según la gravedad.',
  },
  {
    question: '¿Qué garantías ofrece Conexia para los pagos?',
    answer:
      'Conexia actúa como intermediario de confianza, realizando el/los pagos solo cuando el cliente aprueba el trabajo. Y permite reclamos si hay disconformidad. Esto protege tanto al cliente como al proveedor.',
  },
  {
    question: '¿Cómo se garantiza la seguridad en la comunidad?',
    answer:
      'Cada acción queda registrada y asociada a un usuario verificado. Hay un sistema de reportes y revisión, tanto con IA como manual. Se aplican políticas de suspensión para usuarios con comportamiento indebido. Los datos personales están protegidos según la política de privacidad de Conexia.',
  },
];

async function seedQuestions() {
  await AppDataSource.initialize();
  const faqRepo = AppDataSource.getRepository(FaqEmbedding);

  let count = 0;
  let embeddingCount = 0;

  for (const qa of questions) {
    // Verificar si ya existe
    const existsFaq = await faqRepo.findOne({
      where: { question: qa.question },
    });

    if (existsFaq) {
      console.log(
        `⏭️  Pregunta '${qa.question.substring(0, 50)}...' ya existe.`,
      );
      continue;
    }

    // Generar embedding
    let embedding: number[] | null = null;
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: qa.question,
      });
      embedding = response.data[0].embedding;
      embeddingCount++;
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error generando embedding para: ${qa.question}`, error);
    }

    // Crear FAQ con embedding
    const faq = faqRepo.create({
      ...qa,
      embedding,
      createdAt: new Date(),
    });
    await faqRepo.save(faq);
    console.log(`✓ Pregunta '${qa.question.substring(0, 50)}...' creada.`);
    count++;
  }

  console.log(`\nSe crearon ${count} preguntas.`);

  // Generar embeddings para FAQs sin embedding
  const faqsWithoutEmbeddings = await faqRepo
    .createQueryBuilder('faq')
    .where('faq.embedding IS NULL')
    .getMany();

  if (faqsWithoutEmbeddings.length > 0) {
    console.log(
      `\nGenerando embeddings para ${faqsWithoutEmbeddings.length} FAQs...`,
    );

    for (const faq of faqsWithoutEmbeddings) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: faq.question,
        });

        faq.embedding = response.data[0].embedding;
        faq.updatedAt = new Date();

        await faqRepo.save(faq);
        embeddingCount++;
        console.log(
          `✓ Embedding generado: ${faq.question.substring(0, 50)}...`,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error generando embedding para FAQ ${faq.id}:`, error);
      }
    }
  }

  console.log(`\n✓ Se generaron ${embeddingCount} embeddings exitosamente`);
  await AppDataSource.destroy();
}

seedQuestions()
  .then(() => {
    console.log('Seed de preguntas y embeddings finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error en el seed de preguntas:', err);
    process.exit(1);
  });
