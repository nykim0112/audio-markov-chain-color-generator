const TAU = Math.PI * 2; 

export class GlowParticle {
    constructor(x, y, radius, rgb){
        this.x = x; 
        this.y = y; 
        this.radius = radius; 
        this.rgb = rgb; 

        this.vx = Math.random() * 4; 
        this.vy = Math.random() * 4; 

        this.sinVal = Math.random()
    }

    animate(ctx, stageWidth, stageHeight){
        this.sinVal += 0.01; 
        this.radius += Math.sin(this.sinVal)

        this.x += this.vx
        this.y += this.vy
        
        if(this.x < 0){
            this.vx *= -1; 
            this.x +=10; 
        }else if(this.x > stageWidth){
            this.vy *= -1; 
            this.y +=10; 
        }

        if(this.y < 0){
            this.vx *= -1; 
            this.y +=10; 
        }else if(this.y > stageWidth){
            this.vy *= -1; 
            this.x +=10; 
        }

        ctx.beginPath(); 
        const g = ctx.createRadialGradient(
            this.x, 
            this.y, 
            this.radius * 0.01, 
            this.x, 
            this.y, 
            this.radius
        ); 
        g.addColorStop(0, `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, 1)`);
        g.addColorStop(1, `rgba(${this.rgb.r}, ${this.rgb.g}, ${this.rgb.b}, 0)`);
        ctx.fillStyle = g
        ctx.arc(this.x, this.y, this.radius, 0, TAU, false); 
        ctx.fill()
    }
}