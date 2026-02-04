import { Play, ExternalLink, Music, Video } from "lucide-react";

interface MediaEmbedProps {
  url: string;
  title?: string;
  description?: string;
  className?: string;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regExp);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
};

const getSpotifyEmbedUrl = (url: string): string | null => {
  const regExp = /open\.spotify\.com\/(track|episode|album|playlist)\/([a-zA-Z0-9]+)/;
  const match = url.match(regExp);
  if (match && match[1] && match[2]) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  return null;
};

export function MediaEmbed({ url, title, description, className = "" }: MediaEmbedProps) {
  const youtubeEmbed = getYouTubeEmbedUrl(url);
  if (youtubeEmbed) {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <iframe
          src={youtubeEmbed}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const vimeoEmbed = getVimeoEmbedUrl(url);
  if (vimeoEmbed) {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <iframe
          src={vimeoEmbed}
          className="w-full aspect-video rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const spotifyEmbed = getSpotifyEmbedUrl(url);
  if (spotifyEmbed) {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <iframe
          src={spotifyEmbed}
          className="w-full rounded-lg"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
    );
  }

  if (url.includes("soundcloud.com")) {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 transition-colors"
        >
          <Music className="w-5 h-5" />
          <span>פתח ב-SoundCloud</span>
          <ExternalLink className="w-4 h-4 mr-auto" />
        </a>
      </div>
    );
  }

  if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <audio controls className="w-full">
          <source src={url} />
          הדפדפן שלך לא תומך בנגן אודיו.
        </audio>
      </div>
    );
  }

  if (url.match(/\.(mp4|webm|mov)$/i)) {
    return (
      <div className={`space-y-2 ${className}`}>
        {title && <h4 className="font-medium text-sm">{title}</h4>}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <video controls className="w-full rounded-lg" style={{ maxHeight: '300px' }}>
          <source src={url} />
          הדפדפן שלך לא תומך בנגן וידאו.
        </video>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {title && <h4 className="font-medium text-sm">{title}</h4>}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg text-violet-700 hover:bg-violet-100 transition-colors"
      >
        <Play className="w-5 h-5" />
        <span>{title || "פתח לינק"}</span>
        <ExternalLink className="w-4 h-4 mr-auto" />
      </a>
    </div>
  );
}

export function detectMediaUrl(text: string): { url: string; start: number; end: number } | null {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const match = urlPattern.exec(text);
  if (match) {
    const url = match[1];
    if (
      url.includes("youtube.com") || 
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.includes("spotify.com") ||
      url.includes("soundcloud.com") ||
      url.match(/\.(mp3|wav|ogg|m4a|mp4|webm|mov)$/i)
    ) {
      return { url, start: match.index, end: match.index + url.length };
    }
  }
  return null;
}

export function parseMediaFromMessage(content: string): { text: string; mediaUrl?: string } {
  const mediaMatch = detectMediaUrl(content);
  if (mediaMatch) {
    const textBefore = content.substring(0, mediaMatch.start).trim();
    const textAfter = content.substring(mediaMatch.end).trim();
    const text = `${textBefore} ${textAfter}`.trim();
    return { text, mediaUrl: mediaMatch.url };
  }
  return { text: content };
}
