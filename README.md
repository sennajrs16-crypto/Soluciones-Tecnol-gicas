# Sistema de Ventas e Inventario para PYMES

Un sistema web de gestión de ventas e inventario con autenticación simple para pequeñas y medianas empresas.

## Características

- **Autenticación segura**: Login con usuario y contraseña en página dedicada (2 usuarios permitidos)
- **Gestión de productos**: Crear, editar, eliminar y visualizar productos en tabla
- **Control de inventario**: Seguimiento automático del stock disponible
- **Registro de ventas**: Registrar ventas y deducción automática de inventario
- **Dashboard**: Estadísticas de productos, valor de inventario, total de ventas y alertas de stock bajo
- **Persistencia local**: Todos los datos se guardan en localStorage del navegador
- **Interfaz responsive**: Diseño adaptable a dispositivos móviles

## Estructura de archivos

```
ST/
├── index.html          # Página principal (sistema de gestión) - Solo para usuarios autenticados
├── login.html          # Página de autenticación - Punto de entrada
├── css/
│   └── estilo.css      # Estilos responsivos
├── js/
│   ├── app.js          # Lógica principal de la aplicación
│   └── login.js        # Lógica de autenticación
└── img/                # Carpeta para imágenes de productos
```

## Inicio rápido

1. **Abre `login.html`** en tu navegador web (es la página de inicio)
2. **Selecciona un usuario** de la lista desplegable
3. **Ingresa la contraseña** en el campo correspondiente
4. **Haz clic en "Entrar"**

Usuarios permitidos:
- Milton Fernando Quintero Lozano
- Maria Alejandra Quintero Santamaria

## Flujo de uso

```
login.html (Autenticación)
    ↓
index.html (Sistema completo)
    ├─ Gestionar Productos
    ├─ Registrar Ventas
    ├─ Ver Historial
    └─ Ver Dashboard
```

## Funcionalidades detalladas

### 1. Página de Login (`login.html`)
- Selector con los 2 usuarios permitidos
- Campo de contraseña oculto (tipo password)
- Validación de credenciales
- Mensajes de error claros
- Redirección automática si ya estás autenticado

### 2. Página Principal (`index.html`)
Accesible solo después de autenticarse. Contiene:

#### Sección de Productos
- Formulario para añadir/editar productos
- Campos: Nombre, SKU, Precio, Stock, Imagen (URL)
- Tabla con todos los productos
- Botones de Editar y Eliminar por producto

#### Sección de Ventas
- Dropdown para seleccionar producto
- Campo de cantidad
- Botón para registrar venta
- Historial completo de ventas (fecha, producto, cantidad, precio, total)
- Deducción automática del stock

#### Dashboard
- Total de productos en catálogo
- Valor total del inventario (precio × stock)
- Suma de todas las ventas registradas
- Alertas de stock bajo (≤ 5 unidades)

## Almacenamiento de datos

Los datos se guardan automáticamente en `localStorage`:

- **`pyme_inventory_v1`**: Almacena todos los productos y ventas (JSON)
- **`pyme_current_user`**: Almacena el usuario autenticado actualmente

### Estructura de datos (Ejemplo)
```json
{
  "products": [
    {
      "id": "1234567890abc",
      "name": "Laptop",
      "sku": "LP-001",
      "price": 899.99,
      "stock": 5,
      "image": "https://ejemplo.com/laptop.jpg"
    }
  ],
  "sales": [
    {
      "date": "2025-11-15T10:30:00.000Z",
      "name": "Laptop",
      "sku": "LP-001",
      "qty": 1,
      "price": 899.99,
      "total": 899.99
    }
  ]
}
```

## Seguridad

⚠️ **Importante**: Este es un sistema de demostración/uso local

- Las credenciales están en el código JavaScript (visibles en el navegador)
- Los datos se almacenan solo en el navegador del usuario
- **NO apto para producción o datos sensibles**
- Usar solo en:
  - Desarrollo y pruebas
  - Red local privada
  - Uso educativo

## Navegación y cierre de sesión

- **Inicio**: Siempre abre `login.html`
- **Durante sesión**: Usa los botones y formularios en `index.html`
- **Cerrar sesión**: Haz clic en "Cerrar sesión" (esquina superior derecha)
  - Te redirigirá a `login.html`
  - La sesión se elimina de localStorage

## Datos de prueba sugeridos

Prueba el sistema añadiendo estos productos:

| Nombre | SKU | Precio | Stock |
|--------|-----|--------|-------|
| Laptop Dell | LD-001 | 899.99 | 5 |
| Mouse Logitech | ML-002 | 29.99 | 20 |
| Teclado Mecánico | TM-003 | 119.99 | 8 |
| Monitor LG 24" | MN-004 | 199.99 | 3 |
| Cable USB | CB-005 | 9.99 | 50 |

Luego registra algunas ventas para ver cómo el stock disminuye automáticamente.

## Notas técnicas

- **Frontend**: HTML5, CSS3, JavaScript vanilla (sin dependencias)
- **Responsive**: Media queries para móviles, tablets y escritorio
- **Compatible**: Chrome, Edge, Firefox, Safari (navegadores modernos)
- **Almacenamiento**: localStorage (no requiere servidor)

## Limitaciones actuales

- Sin backend/base de datos
- Sin export/import de datos
- Sin categorías de productos
- Sin reportes avanzados
- Sin múltiples permisos de usuario
- Sin respaldo automático

## Futuras mejoras sugeridas

- [ ] Exportar/importar datos (CSV, Excel, JSON)
- [ ] Categorías y subcategorías de productos
- [ ] Reportes por fecha/período
- [ ] Gráficas de ventas
- [ ] Búsqueda y filtros avanzados
- [ ] Impresión de reportes
- [ ] Backend con base de datos real
- [ ] Permisos de usuario personalizados

---

**Versión**: 2.0  
**Última actualización**: Noviembre 2025  
**Estado**: ✅ Funcional y listo para usar
