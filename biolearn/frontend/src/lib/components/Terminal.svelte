<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Terminal } from '@xterm/xterm';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebLinksAddon } from '@xterm/addon-web-links';
	import '@xterm/xterm/css/xterm.css';

	let terminalContainer: HTMLDivElement;
	let terminal: Terminal;
	let fitAddon: FitAddon;
	let resizeObserver: ResizeObserver;

	// WebSocket connection for backend
	let ws: WebSocket | null = null;
	let commandBuffer = '';

	const terminalOptions = {
		theme: {
			background: '#1e1e1e',
			foreground: '#d4d4d4',
			cursor: '#d4d4d4',
			cursorAccent: '#1e1e1e',
			selectionBackground: '#264f78',
			black: '#1e1e1e',
			red: '#f44747',
			green: '#4ec9b0',
			yellow: '#dcdcaa',
			blue: '#569cd6',
			magenta: '#c586c0',
			cyan: '#9cdcfe',
			white: '#d4d4d4',
			brightBlack: '#808080',
			brightRed: '#f44747',
			brightGreen: '#4ec9b0',
			brightYellow: '#dcdcaa',
			brightBlue: '#569cd6',
			brightMagenta: '#c586c0',
			brightCyan: '#9cdcfe',
			brightWhite: '#ffffff'
		},
		fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
		fontSize: 14,
		lineHeight: 1.2,
		cursorBlink: true,
		cursorStyle: 'block' as const,
		scrollback: 10000,
		allowProposedApi: true
	};

	function connectWebSocket() {
		// TODO: Connect to actual backend WebSocket
		// For now, we'll simulate locally
		console.log('WebSocket connection would be established here');
	}

	function writePrompt() {
		terminal.write('\r\n\x1b[32mbiolearn\x1b[0m:\x1b[34m~\x1b[0m$ ');
	}

	function handleInput(data: string) {
		// Handle special keys
		if (data === '\r') {
			// Enter key
			terminal.write('\r\n');
			if (commandBuffer.trim()) {
				executeCommand(commandBuffer.trim());
			}
			commandBuffer = '';
			writePrompt();
		} else if (data === '\x7f') {
			// Backspace
			if (commandBuffer.length > 0) {
				commandBuffer = commandBuffer.slice(0, -1);
				terminal.write('\b \b');
			}
		} else if (data === '\x03') {
			// Ctrl+C
			terminal.write('^C');
			commandBuffer = '';
			writePrompt();
		} else if (data >= ' ' || data === '\t') {
			// Printable characters
			commandBuffer += data;
			terminal.write(data);
		}
	}

	function executeCommand(cmd: string) {
		// TODO: Send to backend via WebSocket
		// For now, show a placeholder response
		if (cmd === 'help') {
			terminal.writeln('\x1b[33mAvailable commands:\x1b[0m');
			terminal.writeln('  fastqc     - Quality control for FASTQ files');
			terminal.writeln('  trimmomatic - Trim adapters and low-quality bases');
			terminal.writeln('  unicycler  - Assemble bacterial genomes');
			terminal.writeln('  quast      - Assembly quality assessment');
			terminal.writeln('  abricate   - Screen for AMR/virulence genes');
			terminal.writeln('  help       - Show this help message');
			terminal.writeln('  clear      - Clear the terminal');
		} else if (cmd === 'clear') {
			terminal.clear();
		} else {
			terminal.writeln(`\x1b[36mExecuting: ${cmd}\x1b[0m`);
			terminal.writeln('\x1b[90m[Connecting to analysis backend...]\x1b[0m');
		}
	}

	onMount(() => {
		terminal = new Terminal(terminalOptions);
		fitAddon = new FitAddon();
		const webLinksAddon = new WebLinksAddon();

		terminal.loadAddon(fitAddon);
		terminal.loadAddon(webLinksAddon);
		terminal.open(terminalContainer);

		// Fit terminal to container
		setTimeout(() => fitAddon.fit(), 0);

		// Handle resize
		resizeObserver = new ResizeObserver(() => {
			fitAddon.fit();
		});
		resizeObserver.observe(terminalContainer);

		// Welcome message
		terminal.writeln('\x1b[1;36m╔═══════════════════════════════════════════════════════╗\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   \x1b[1;32mBioLearn\x1b[0m - Bioinformatics Learning Terminal         \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   Type \x1b[33mhelp\x1b[0m for available commands                     \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════════════════════╝\x1b[0m');
		writePrompt();

		// Handle input
		terminal.onData(handleInput);

		// Connect to backend
		connectWebSocket();
	});

	onDestroy(() => {
		if (resizeObserver) {
			resizeObserver.disconnect();
		}
		if (terminal) {
			terminal.dispose();
		}
		if (ws) {
			ws.close();
		}
	});
</script>

<div
	bind:this={terminalContainer}
	class="w-full h-full p-2"
></div>

<style>
	div {
		background-color: #1e1e1e;
	}

	:global(.xterm) {
		padding: 8px;
	}

	:global(.xterm-viewport) {
		overflow-y: auto !important;
	}
</style>
