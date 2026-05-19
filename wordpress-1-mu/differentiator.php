<?php
/*
Plugin Name: Site Differentiator - Principal
Description: Displays a floating badge identifying this as the Principal WordPress instance.
Version: 1.0
Author: Antigravity
*/

// Sobrescribir variables de servidor para compatibilidad con subruta de proxy inverso (/wordpress)
if (isset($_SERVER['HTTP_X_REAL_IP']) || (isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] === 'localhost' && !in_array($_SERVER['SERVER_PORT'], ['8081', '8082']))) {
    if (strpos($_SERVER['REQUEST_URI'], '/wordpress') !== 0) {
        $_SERVER['REQUEST_URI'] = '/wordpress' . $_SERVER['REQUEST_URI'];
        $_SERVER['SCRIPT_NAME'] = '/wordpress' . $_SERVER['SCRIPT_NAME'];
        $_SERVER['PHP_SELF']    = '/wordpress' . $_SERVER['PHP_SELF'];
    }
}

if (!defined('ABSPATH')) exit;

function wp_diff_badge_principal() {
    ?>
    <style>
        #wp-site-diff-badge {
            position: fixed;
            top: 12px;
            left: 12px;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 8px 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px;
            font-weight: 600;
            border-radius: 30px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            z-index: 999999;
            border: 1px solid rgba(16, 185, 129, 0.5);
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: none;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            transition: all 0.3s ease;
        }
        
        #wp-site-diff-badge .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
            }
            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }

        /* If admin bar is present on frontend */
        body.admin-bar #wp-site-diff-badge {
            top: 46px !important;
        }

        /* If inside WP Admin dashboard */
        body.wp-admin #wp-site-diff-badge {
            top: 5px !important;
            left: 240px !important; /* Positions it nicely on the admin bar */
            height: 22px !important;
            padding: 2px 12px !important;
            font-size: 11px !important;
            border-radius: 4px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            box-shadow: none !important;
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }

        /* For mobile screens */
        @media screen and (max-width: 782px) {
            body.admin-bar #wp-site-diff-badge {
                top: 60px !important;
            }
            body.wp-admin #wp-site-diff-badge {
                display: none !important; /* Hide in mobile admin to avoid clutter */
            }
        }
    </style>
    <div id="wp-site-diff-badge">
        <div class="pulse-dot"></div>
        <span>WordPress Principal</span>
    </div>
    <?php
}

add_action('wp_footer', 'wp_diff_badge_principal', 9999);
add_action('admin_footer', 'wp_diff_badge_principal', 9999);
