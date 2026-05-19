<?php

/**
 * @package     Joomla.Site
 * @subpackage  Templates.cassiopeia
 *
 * @copyright   (C) 2017 Open Source Matters, Inc. <https://www.joomla.org>
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\HTML\HTMLHelper;
use Joomla\CMS\Language\Text;
use Joomla\CMS\Uri\Uri;

/** @var Joomla\CMS\Document\HtmlDocument $this */

$app   = Factory::getApplication();
$input = $app->getInput();
$wa    = $this->getWebAssetManager();

// Browsers support SVG favicons
$this->addHeadLink(HTMLHelper::_('image', 'joomla-favicon.svg', '', [], true, 1), 'icon', 'rel', ['type' => 'image/svg+xml']);
$this->addHeadLink(HTMLHelper::_('image', 'favicon.ico', '', [], true, 1), 'alternate icon', 'rel', ['type' => 'image/vnd.microsoft.icon']);
$this->addHeadLink(HTMLHelper::_('image', 'joomla-favicon-pinned.svg', '', [], true, 1), 'mask-icon', 'rel', ['color' => '#000']);

// Detecting Active Variables
$option   = $input->getCmd('option', '');
$view     = $input->getCmd('view', '');
$layout   = $input->getCmd('layout', '');
$task     = $input->getCmd('task', '');
$itemid   = $input->getCmd('Itemid', '');
$sitename = htmlspecialchars($app->get('sitename'), ENT_QUOTES, 'UTF-8');

// Replicate WordPress URL Parameter Routing
$pageId = isset($_GET['page_id']) ? (int)$_GET['page_id'] : 0;

// Detect if we should render our custom high-fidelity replicated pages
// This triggers for the homepage (0) and the specific subpages (7, 8, 9)
$isCustomRoute = in_array($pageId, [0, 7, 8, 9]);

// Color Theme
$paramsColorName = $this->params->get('colorName', 'colors_standard');
$assetColorName  = 'theme.' . $paramsColorName;

// Use a font scheme if set in the template style options
$paramsFontScheme = $this->params->get('useFontScheme', false);
$fontStyles       = '';

if ($paramsFontScheme) {
    if (stripos($paramsFontScheme, 'https://') === 0) {
        $this->getPreloadManager()->preconnect('https://fonts.googleapis.com/', ['crossorigin' => 'anonymous']);
        $this->getPreloadManager()->preconnect('https://fonts.gstatic.com/', ['crossorigin' => 'anonymous']);
        $this->getPreloadManager()->preload($paramsFontScheme, ['as' => 'style', 'crossorigin' => 'anonymous']);
        $wa->registerAndUseStyle('fontscheme.current', $paramsFontScheme, [], ['rel' => 'lazy-stylesheet', 'crossorigin' => 'anonymous']);

        if (preg_match_all('/family=([^?:]*):/i', $paramsFontScheme, $matches) > 0) {
            $fontStyles = '--cassiopeia-font-family-body: "' . str_replace('+', ' ', $matches[1][0]) . '", sans-serif;
			--cassiopeia-font-family-headings: "' . str_replace('+', ' ', $matches[1][1] ?? $matches[1][0]) . '", sans-serif;
			--cassiopeia-font-weight-normal: 400;
			--cassiopeia-font-weight-headings: 700;';
        }
    } elseif ($paramsFontScheme === 'system') {
        $fontStylesBody    = $this->params->get('systemFontBody', '');
        $fontStylesHeading = $this->params->get('systemFontHeading', '');

        if ($fontStylesBody) {
            $fontStyles = '--cassiopeia-font-family-body: ' . $fontStylesBody . ';
            --cassiopeia-font-weight-normal: 400;';
        }
        if ($fontStylesHeading) {
            $fontStyles .= '--cassiopeia-font-family-headings: ' . $fontStylesHeading . ';
    		--cassiopeia-font-weight-headings: 700;';
        }
    } else {
        $wa->registerAndUseStyle('fontscheme.current', $paramsFontScheme, ['version' => 'auto'], ['rel' => 'lazy-stylesheet']);
        $this->getPreloadManager()->preload($wa->getAsset('style', 'fontscheme.current')->getUri() . '?' . $this->getMediaVersion(), ['as' => 'style']);
    }
}

// Enable assets
$wa->usePreset('template.cassiopeia.' . ($this->direction === 'rtl' ? 'rtl' : 'ltr'))
    ->useStyle('template.active.language')
    ->registerAndUseStyle($assetColorName, 'global/' . $paramsColorName . '.css')
    ->useStyle('template.user')
    ->useScript('template.user')
    ->addInlineStyle(":root {
		--hue: 214;
		--template-bg-light: #f0f4fb;
		--template-text-dark: #495057;
		--template-text-light: #ffffff;
		--template-link-color: var(--link-color);
		--template-special-color: #001B4C;
		$fontStyles
	}");

// Override 'template.active' asset to set correct ltr/rtl dependency
$wa->registerStyle('template.active', '', [], [], ['template.cassiopeia.' . ($this->direction === 'rtl' ? 'rtl' : 'ltr')]);

// Logo file or site title param
if ($this->params->get('logoFile')) {
    $logo = HTMLHelper::_('image', Uri::root(false) . htmlspecialchars($this->params->get('logoFile'), ENT_QUOTES), $sitename, ['loading' => 'eager', 'decoding' => 'async'], false, 0);
} elseif ($this->params->get('siteTitle')) {
    $logo = '<span title="' . $sitename . '">' . htmlspecialchars($this->params->get('siteTitle'), ENT_COMPAT, 'UTF-8') . '</span>';
} else {
    $logo = HTMLHelper::_('image', 'logo.svg', $sitename, ['class' => 'logo d-inline-block', 'loading' => 'eager', 'decoding' => 'async'], true, 0);
}

$hasClass = '';

if ($this->countModules('sidebar-left', true)) {
    $hasClass .= ' has-sidebar-left';
}

if ($this->countModules('sidebar-right', true)) {
    $hasClass .= ' has-sidebar-right';
}

// Container
$wrapper = $this->params->get('fluidContainer') ? 'wrapper-fluid' : 'wrapper-static';

$this->setMetaData('viewport', 'width=device-width, initial-scale=1');

$stickyHeader = $this->params->get('stickyHeader') ? 'position-sticky sticky-top' : '';

// Defer fontawesome for increased performance. Once the page is loaded javascript changes it to a stylesheet.
$wa->getAsset('style', 'fontawesome')->setAttribute('rel', 'lazy-stylesheet');
?>
<!DOCTYPE html>
<html lang="<?php echo $this->language; ?>" dir="<?php echo $this->direction; ?>">

<head>
    <?php 
    // Ajustar base URL de Joomla para evitar redireccionamientos fuera de la subruta del proxy
    $this->base = 'http://localhost/joomla/';
    $this->baseurl = '/joomla';
    ?>
    <jdoc:include type="metas" />
    <jdoc:include type="styles" />
    <jdoc:include type="scripts" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            --accent-gradient: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            --dark-bg: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --card-border: rgba(255, 255, 255, 0.08);
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
        }

        body.techstore-home {
            background-color: #0b0f19 !important;
            color: var(--text-main) !important;
            font-family: 'Inter', sans-serif !important;
            margin: 0;
            overflow-x: hidden;
            background-image: 
                radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(30, 64, 175, 0.15) 0px, transparent 50%) !important;
        }

        .custom-navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 8%;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .navbar-brand-custom {
            font-family: 'Outfit', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
            letter-spacing: -0.5px;
            margin-left: 160px;
        }

        .navbar-links {
            display: flex;
            gap: 30px;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .navbar-links a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .navbar-links a:hover, .navbar-links a.active {
            color: #ffffff;
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .navbar-status {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .navbar-status .status-dot {
            width: 6px;
            height: 6px;
            background-color: #10b981;
            border-radius: 50%;
            animation: status-pulse 2s infinite;
        }

        @keyframes status-pulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
        }

        /* Views Styles */
        .content-container {
            padding: 60px 8%;
            max-width: 1200px;
            margin: 0 auto;
        }

        .hero-section {
            padding: 40px 0 60px 0;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .hero-badge {
            background: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.2);
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 20px;
        }

        .hero-title {
            font-family: 'Outfit', sans-serif;
            font-size: 56px;
            font-weight: 900;
            margin: 0 0 20px 0;
            background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -1.5px;
        }

        .hero-subtitle {
            color: var(--text-muted);
            font-size: 18px;
            max-width: 600px;
            line-height: 1.6;
            margin-bottom: 40px;
        }

        .hero-ctas {
            display: flex;
            gap: 20px;
        }

        .btn-primary-custom {
            background: var(--primary-gradient);
            color: #ffffff;
            border: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
        }

        .btn-primary-custom:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
            color: #ffffff;
        }

        .btn-secondary-custom {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 12px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
        }

        .btn-secondary-custom:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            color: #ffffff;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            padding: 20px 0 60px 0;
        }

        .feature-card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 35px;
            border-radius: 12px;
            backdrop-filter: blur(12px);
            transition: all 0.3s ease;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-decoration: none;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 10px 30px -10px rgba(59, 130, 246, 0.2);
        }

        .card-icon {
            font-size: 32px;
            margin-bottom: 20px;
        }

        .card-title {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 12px 0;
            color: #ffffff;
        }

        .card-desc {
            color: var(--text-muted);
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 25px;
        }

        .card-link {
            color: #60a5fa;
            font-weight: 600;
            font-size: 13px;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .feature-card:hover .card-link {
            color: #ffffff;
        }

        .infrastructure-section {
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 50px;
            text-align: center;
            margin-top: 20px;
        }

        .infra-title {
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 15px;
            color: #ffffff;
        }

        .infra-desc {
            color: var(--text-muted);
            font-size: 15px;
            max-width: 800px;
            line-height: 1.6;
            margin: 0 auto;
        }

        /* Replicated Pages Layout */
        .subpage-container {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            padding: 50px;
            border-radius: 16px;
            backdrop-filter: blur(12px);
            margin-top: 20px;
        }

        .subpage-header {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 30px;
            margin-bottom: 40px;
        }

        .subpage-tagline {
            font-size: 12px;
            font-weight: 600;
            color: #60a5fa;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .subpage-title {
            font-family: 'Outfit', sans-serif;
            font-size: 40px;
            font-weight: 800;
            color: #ffffff;
            margin: 0;
            letter-spacing: -1px;
        }

        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 40px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .text-block {
            color: var(--text-muted);
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 25px;
        }

        /* Replicated Grid and Items */
        .replicated-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 40px;
        }

        .replicated-item-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 12px;
        }

        .replicated-item-title {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 10px;
        }

        /* Products Grid */
        .products-grid-custom {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 30px;
        }

        .prod-card-custom {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 12px;
            transition: all 0.3s ease;
        }

        .prod-card-custom:hover {
            border-color: rgba(59, 130, 246, 0.3);
            background: rgba(59, 130, 246, 0.02);
        }

        .prod-name-custom {
            font-family: 'Outfit', sans-serif;
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .prod-price-custom {
            font-size: 22px;
            font-weight: 800;
            color: #60a5fa;
            margin-bottom: 15px;
        }

        .prod-stock-custom {
            font-size: 13px;
            color: #10b981;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Channels list */
        .channels-list-custom {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 30px;
        }

        .channel-item-custom {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 20px 25px;
            border-radius: 12px;
            color: #ffffff;
            text-decoration: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            transition: all 0.2s;
        }

        .channel-item-custom:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.3);
            transform: translateX(6px);
            color: #ffffff;
        }

        .custom-footer-bottom {
            padding: 40px 0;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            margin-top: 60px;
        }

        /* Joomla Differentiator Badge Styles */
        #joomla-site-diff-badge {
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
            border: 1px solid rgba(245, 158, 11, 0.5);
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: none;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            transition: all 0.3s ease;
        }
        
        #joomla-site-diff-badge .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: #f59e0b;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
            animation: pulse-amber 2s infinite;
        }

        @keyframes pulse-amber {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
            }
            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
            }
        }
    </style>
</head>

<body class="<?php echo $isCustomRoute ? 'techstore-home' : 'site'; ?> <?php echo $option
    . ' ' . $wrapper
    . ' view-' . $view
    . ($layout ? ' layout-' . $layout : ' no-layout')
    . ($task ? ' task-' . $task : ' no-task')
    . ($itemid ? ' itemid-' . $itemid : '')
    . ($pageclass ? ' ' . $pageclass : '')
    . $hasClass
    . ($this->direction == 'rtl' ? ' rtl' : '');
 ?>">

<?php if (!$isCustomRoute) : ?>
    <header class="header container-header full-width<?php echo $stickyHeader ? ' ' . $stickyHeader : ''; ?>">

        <?php if ($this->countModules('topbar')) : ?>
            <div class="container-topbar">
                <jdoc:include type="modules" name="topbar" style="none" />
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('below-top')) : ?>
            <div class="grid-child container-below-top">
                <jdoc:include type="modules" name="below-top" style="none" />
            </div>
        <?php endif; ?>

        <?php if ($this->params->get('brand', 1)) : ?>
            <div class="grid-child">
                <div class="navbar-brand">
                    <a class="brand-logo" href="<?php echo $this->baseurl; ?>/">
                        <?php echo $logo; ?>
                    </a>
                    <?php if ($this->params->get('siteDescription')) : ?>
                        <div class="site-description"><?php echo htmlspecialchars($this->params->get('siteDescription')); ?></div>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('menu', true) || $this->countModules('search', true)) : ?>
            <div class="grid-child container-nav">
                <?php if ($this->countModules('menu', true)) : ?>
                    <jdoc:include type="modules" name="menu" style="none" />
                <?php endif; ?>
                <?php if ($this->countModules('search', true)) : ?>
                    <div class="container-search">
                        <jdoc:include type="modules" name="search" style="none" />
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </header>

    <div class="site-grid">
        <?php if ($this->countModules('banner', true)) : ?>
            <div class="container-banner full-width">
                <jdoc:include type="modules" name="banner" style="none" />
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('top-a', true)) : ?>
            <div class="grid-child container-top-a">
                <jdoc:include type="modules" name="top-a" style="card" />
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('top-b', true)) : ?>
            <div class="grid-child container-top-b">
                <jdoc:include type="modules" name="top-b" style="card" />
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('sidebar-left', true)) : ?>
            <div class="grid-child container-sidebar-left">
                <jdoc:include type="modules" name="sidebar-left" style="card" />
            </div>
        <?php endif; ?>

        <div class="grid-child container-component">
            <jdoc:include type="modules" name="breadcrumbs" style="none" />
            <jdoc:include type="modules" name="main-top" style="card" />
            <jdoc:include type="message" />
            <main>
                <jdoc:include type="component" />
            </main>
            <jdoc:include type="modules" name="main-bottom" style="card" />
        </div>

        <?php if ($this->countModules('sidebar-right', true)) : ?>
            <div class="grid-child container-sidebar-right">
                <jdoc:include type="modules" name="sidebar-right" style="card" />
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('bottom-a', true)) : ?>
            <div class="grid-child container-bottom-a">
                <jdoc:include type="modules" name="bottom-a" style="card" />
            </div>
        <?php endif; ?>

        <?php if ($this->countModules('bottom-b', true)) : ?>
            <div class="grid-child container-bottom-b">
                <jdoc:include type="modules" name="bottom-b" style="card" />
            </div>
        <?php endif; ?>
    </div>

    <?php if ($this->countModules('footer', true)) : ?>
        <footer class="container-footer footer full-width">
            <div class="grid-child">
                <jdoc:include type="modules" name="footer" style="none" />
            </div>
        </footer>
    <?php endif; ?>

    <?php if ($this->params->get('backTop') == 1) : ?>
        <a href="#top" id="back-top" class="back-to-top-link" aria-label="<?php echo Text::_('TPL_CASSIOPEIA_BACKTOTOP'); ?>">
            <span class="icon-arrow-up icon-fw" aria-hidden="true"></span>
        </a>
    <?php endif; ?>

<?php else : ?>
    <!-- Custom Replicated E-Commerce Portal Ecosistema Replicado -->
    <nav class="custom-navbar">
        <a class="navbar-brand-custom" href="/joomla/index.php">
            <span>⚡ TECHSTORE 360</span>
        </a>
        <ul class="navbar-links">
            <li><a href="/joomla/index.php" class="<?php echo $pageId === 0 ? 'active' : ''; ?>">Inicio</a></li>
            <li><a href="/joomla/?page_id=7" class="<?php echo $pageId === 7 ? 'active' : ''; ?>">Nosotros / UTA</a></li>
            <li><a href="/joomla/?page_id=8" class="<?php echo $pageId === 8 ? 'active' : ''; ?>">Catálogo</a></li>
            <li><a href="/joomla/?page_id=9" class="<?php echo $pageId === 9 ? 'active' : ''; ?>">Canales</a></li>
        </ul>
        <div class="navbar-status">
            <div class="status-dot"></div>
            <span>● API ONLINE</span>
        </div>
    </nav>

    <div class="content-container">
        
        <?php if ($pageId === 0) : ?>
            <!-- Homepage View (Identical content to WordPress) -->
            <section class="hero-section">
                <div class="hero-badge">PLATAFORMA ACADÉMICA</div>
                <h1 class="hero-title">TECHSTORE 360</h1>
                <p class="hero-subtitle">Portal Corporativo Informativo y Catálogo de Redundancia en Tiempo Real.</p>
                <div class="hero-ctas">
                    <a class="btn-primary-custom" href="/joomla/?page_id=8">Explorar Catálogo</a>
                    <a class="btn-secondary-custom" href="/joomla/?page_id=7">Información UTA</a>
                </div>
            </section>

            <section class="features-grid">
                <a class="feature-card" href="/joomla/?page_id=7">
                    <div>
                        <div class="card-icon">🏛️</div>
                        <h3 class="card-title">Información Institucional</h3>
                        <p class="card-desc">Conoce a la Universidad Técnica de Ambato y la Facultad de Ingeniería (FISEI) que lidera este desarrollo.</p>
                    </div>
                    <span class="card-link">Ver Detalles →</span>
                </a>

                <a class="feature-card" href="/joomla/?page_id=8">
                    <div>
                        <div class="card-icon">🛍️</div>
                        <h3 class="card-title">Catálogo Informativo</h3>
                        <p class="card-desc">Consulta nuestro catálogo dinámico de productos conectados por API REST a nuestra base de datos remota.</p>
                    </div>
                    <span class="card-link">Ir al Catálogo →</span>
                </a>

                <a class="feature-card" href="/joomla/?page_id=9">
                    <div>
                        <div class="card-icon">🔗</div>
                        <h3 class="card-title">Enlaces del Sistema</h3>
                        <p class="card-desc">Accesos rápidos a la plataforma transaccional de compras construida con React y Flutter.</p>
                    </div>
                    <span class="card-link">Ver Enlaces →</span>
                </a>
            </section>

            <section class="infrastructure-section">
                <h2 class="infra-title">Entorno Redundante y Tolerante a Fallos</h2>
                <p class="infra-desc">Esta página corre sobre un esquema balanceado por Nginx Failover entre dos servidores de Joomla replicados localmente. Si el servidor primario experimenta caídas, el tráfico fluye automáticamente al nodo espejo sin degradar la experiencia de usuario.</p>
            </section>

        <?php elseif ($pageId === 7) : ?>
            <!-- Nosotros / UTA View (page_id=7) -->
            <div class="subpage-container">
                <div class="subpage-header">
                    <div class="subpage-tagline">Universidad Técnica de Ambato</div>
                    <h1 class="subpage-title">Información Institucional</h1>
                </div>

                <div class="text-block">
                    <strong>Facultad de Ingeniería en Sistemas, Electrónica e Industrial (FISEI)</strong>
                </div>

                <div class="replicated-grid-2">
                    <div class="replicated-item-card">
                        <h4 class="replicated-item-title">🎯 Misión de la FISEI</h4>
                        <div class="text-block" style="font-size: 14px; margin-bottom: 0;">
                            Formar profesionales líderes competentes, con visión humanista y pensamiento crítico a través de la docencia, la investigación y la vinculación, que apliquen tecnologías de vanguardia para solventar problemas del sector industrial y social del país.
                        </div>
                    </div>
                    <div class="replicated-item-card">
                        <h4 class="replicated-item-title">👁️ Visión de la FISEI</h4>
                        <div class="text-block" style="font-size: 14px; margin-bottom: 0;">
                            Ser una facultad referente en la formación de profesionales líderes de excelencia académica en ingeniería de sistemas, electrónica y afines, reconocidos nacional e internacionalmente por su aporte a la innovación tecnológica y el desarrollo sustentable.
                        </div>
                    </div>
                </div>

                <div class="section-title">💻 Ingeniería de Software & Sistemas Distribuidos</div>
                <div class="text-block">
                    El ecosistema transaccional <strong>TechStore 360</strong> representa un logro de ingeniería de software coordinado en las aulas de la FISEI. Muestra la orquestación e integración práctica de múltiples capas distribuidas y protocolos de comunicación:
                </div>

                <div class="replicated-grid-2" style="margin-top: 20px;">
                    <div class="replicated-item-card" style="padding: 20px;">
                        <h5 class="replicated-item-title" style="font-size: 15px; color: #60a5fa;">Arquitectura Nube/Híbrida</h5>
                        <p class="text-block" style="font-size: 13px; margin-bottom: 0;">Consumo de APIs REST remotas hosteadas en Render conectadas directamente a bases de datos relacionales de Supabase.</p>
                    </div>
                    <div class="replicated-item-card" style="padding: 20px;">
                        <h5 class="replicated-item-title" style="font-size: 15px; color: #60a5fa;">Resiliencia y Replicación</h5>
                        <p class="text-block" style="font-size: 13px; margin-bottom: 0;">Conmutación local automática mediante balanceadores Keepalived / Nginx, asegurando redundancia de servidores web.</p>
                    </div>
                    <div class="replicated-item-card" style="padding: 20px; grid-column: span 2;">
                        <h5 class="replicated-item-title" style="font-size: 15px; color: #60a5fa;">Mensajería Kafka (CDC)</h5>
                        <p class="text-block" style="font-size: 13px; margin-bottom: 0;">Monitoreo transaccional en tiempo real con Debezium y Kafka que dispara notificaciones vía Twilio (SMS/WhatsApp) y Brevo.</p>
                    </div>
                </div>

                <div class="section-title">📍 Universidad Técnica de Ambato</div>
                <div class="text-block" style="margin-bottom: 0;">
                    Av. Los Chasquis y Río Payamino – Ambato, Ecuador
                </div>
            </div>

        <?php elseif ($pageId === 7) : ?>
            <!-- Replicated from WordPress page_id=7 -->

        <?php elseif ($pageId === 8) : ?>
            <!-- Catálogo View (page_id=8) -->
            <div class="subpage-container">
                <div class="subpage-header">
                    <div class="subpage-tagline">Integración API</div>
                    <h1 class="subpage-title">Catálogo Informativo</h1>
                </div>

                <div class="text-block" style="font-size: 18px; color: #ffffff; font-weight: 600; font-family: 'Outfit', sans-serif;">
                    PRODUCTOS OBTENIDOS EN TIEMPO REAL
                </div>
                <div class="text-block">
                    Productos obtenidos en tiempo real de nuestra base de datos remota mediante Cloud API REST.
                </div>

                <div class="replicated-item-card" style="border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.05);">
                    <h5 class="replicated-item-title" style="color: #60a5fa;">Nota de Funcionamiento Local</h5>
                    <div class="text-block" style="font-size: 13.5px; margin-bottom: 0; line-height: 1.6;">
                        Esta sección sirve únicamente para consulta académica y de inventario local. Si deseas realizar transacciones con pasarela de facturación electrónica autorizada por SOAP y recibir notificaciones instantáneas, accede a nuestra Tienda Web React o a la App Flutter.
                        <br><br>
                        <em>Estableciendo túnel REST con Render Cloud API…</em>
                    </div>
                </div>

                <!-- Products Grid -->
                <div id="productos-render-container" class="products-grid-custom">
                    <div class="text-block text-center py-5">Estableciendo túnel REST con Render Cloud API…</div>
                </div>
            </div>

        <?php elseif ($pageId === 9) : ?>
            <!-- Canales View (page_id=9) -->
            <div class="subpage-container">
                <div class="subpage-header">
                    <div class="subpage-tagline">Canales Transaccionales</div>
                    <h1 class="subpage-title">Canales de Compra</h1>
                </div>

                <div class="text-block">
                    Accede a las aplicaciones clientes y realiza compras con facturación SOAP inmediata.
                </div>

                <div class="replicated-grid-2">
                    <div class="replicated-item-card">
                        <h4 class="replicated-item-title" style="color: #60a5fa; font-size: 20px;">Plataforma Web React</h4>
                        <p class="text-block" style="font-size: 13.5px;">Nuestra tienda virtual interactiva optimizada para navegadores web. Agrega artículos, realiza pagos seguros y recibe alertas electrónicas integradas.</p>
                        <a href="http://localhost:3000" class="btn-primary-custom" target="_blank" style="margin-top: 10px; width: 100%; justify-content: center;">Ingresar a la Tienda Web</a>
                    </div>
                    <div class="replicated-item-card">
                        <h4 class="replicated-item-title" style="color: #60a5fa; font-size: 20px;">Aplicación Móvil Flutter</h4>
                        <p class="text-block" style="font-size: 13.5px;">Haz compras nativas desde tu smartphone Android. Experimenta la integración total de geolocalización y notificaciones inmediatas por SMS y WhatsApp.</p>
                        <a href="https://github.com/nixon-hs/ProyectoValido" class="btn-secondary-custom" target="_blank" style="margin-top: 10px; width: 100%; justify-content: center;">Descargar Aplicación (GitHub)</a>
                    </div>
                </div>

                <div class="section-title">Otros Enlaces de la Infraestructura</div>
                <div class="channels-list-custom">
                    <a href="http://localhost:8080" class="channel-item-custom" target="_blank">
                        <span>⚖️ NGINX Balanceador (APIs)</span>
                        <span>Ir →</span>
                    </a>
                    <a href="http://localhost:8000/wsdl?wsdl" class="channel-item-custom" target="_blank">
                        <span>🧾 Servicio SOAP Facturación</span>
                        <span>Ir →</span>
                    </a>
                    <a href="http://localhost" class="channel-item-custom" target="_blank">
                        <span>🔄 NGINX Failover (Portal Principal)</span>
                        <span>Ir →</span>
                    </a>
                </div>
            </div>
        <?php endif; ?>

        <footer class="custom-footer-bottom">
            © 2026 Universidad Técnica de Ambato. Carrera de Software – Sistemas Distribuidos.
        </footer>
    </div>
<?php endif; ?>

    <jdoc:include type="modules" name="debug" style="none" />

    <!-- Custom Joomla Differentiator Badge -->
    <div id="joomla-site-diff-badge">
        <div class="pulse-dot"></div>
        <span>Joomla Servidor</span>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var container = document.getElementById("productos-render-container");
            if (!container) return;

            function getProductIcon(nombre) {
                var n = nombre ? nombre.toLowerCase() : "";
                if (n.indexOf("laptop") !== -1 || n.indexOf("computador") !== -1 || n.indexOf("pc") !== -1) return "💻";
                if (n.indexOf("celular") !== -1 || n.indexOf("telefono") !== -1 || n.indexOf("smartphone") !== -1) return "📱";
                if (n.indexOf("audifono") !== -1 || n.indexOf("auricular") !== -1 || n.indexOf("headphone") !== -1 || n.indexOf("parlante") !== -1) return "🎧";
                if (n.indexOf("reloj") !== -1 || n.indexOf("watch") !== -1) return "⌚";
                if (n.indexOf("teclado") !== -1 || n.indexOf("keyboard") !== -1) return "⌨️";
                if (n.indexOf("monitor") !== -1 || n.indexOf("pantalla") !== -1) return "🖥️";
                return "📦";
            }

            var localUrl = "http://localhost:8080/productos";
            var cloudUrl = "https://api-rest-render-1.onrender.com/productos";

            function cargarProductos(url, fallbackUrl) {
                fetch(url)
                    .then(function(res) {
                        if (!res.ok) throw new Error("HTTP " + res.status);
                        return res.json();
                    })
                    .then(function(productos) {
                        if (!productos || productos.length === 0) {
                            container.innerHTML = '<div class="text-block text-center py-5">No hay productos disponibles actualmente en el catálogo.</div>';
                            return;
                        }

                        var html = "";
                        for (var i = 0; i < productos.length; i++) {
                            var p = productos[i];
                            var icon = getProductIcon(p.nombre || "");
                            var precio = parseFloat(p.precio || 0).toFixed(2);
                            var stock = p.stock !== undefined ? p.stock : 10;
                            var desc = p.descripcion || "Dispositivo tecnológico integrado al catálogo principal de nuestra base de datos distribuidas.";
                            
                            html += '<div class="prod-card-custom" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">';
                            html += '  <div>';
                            html += '    <div style="font-size: 40px; margin-bottom: 15px; text-align: center;">' + icon + '</div>';
                            html += '    <div class="prod-name-custom">' + p.nombre + '</div>';
                            html += '    <p class="text-block" style="font-size: 13px; line-height: 1.5; margin-bottom: 20px; color: var(--text-muted);">' + desc + '</p>';
                            html += '  </div>';
                            html += '  <div>';
                            html += '    <div class="prod-price-custom">$' + precio + '</div>';
                            html += '    <div class="prod-stock-custom">● En Stock (' + stock + ')</div>';
                            html += '  </div>';
                            html += '</div>';
                        }
                        container.innerHTML = html;
                    })
                    .catch(function(err) {
                        console.warn("Fallo carga desde " + url + ": ", err);
                        if (fallbackUrl) {
                            console.log("Intentando fallback...");
                            cargarProductos(fallbackUrl, null);
                        } else {
                            container.innerHTML = '<div class="text-block text-center text-rose-500 font-bold py-5">⚠️ Error al conectar con la API de productos local y nube.</div>';
                        }
                    });
            }

            cargarProductos(localUrl, cloudUrl);
        });
    </script>
</body>

</html>
