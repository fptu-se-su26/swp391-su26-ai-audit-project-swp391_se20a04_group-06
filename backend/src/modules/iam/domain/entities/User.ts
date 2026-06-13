import { AggregateRoot } from "../../../../shared/domain/AggregateRoot";
import { ValidationError } from "../../../../shared/domain/exceptions/DomainException";
import { UserPremiumUpgradedEvent } from "../events/UserPremiumUpgradedEvent";

export interface UserProps {
  name: string;
  email: string;
  passwordHash: string;
  role: "User" | "Admin";
  isActive: boolean;
  isVerified: boolean;
  isPremium: boolean;
  avatar: string | null;
  badges: string[];
  favorites: string[];
  following: string[];
}

export class User extends AggregateRoot<UserProps> {
  public checkActive(): void {
    if (!this.props.isActive) {
      throw new ValidationError("Tài khoản đã bị khoá. Vui lòng liên hệ admin.");
    }
  }

  public upgradeToPremium(): void {
    if (this.props.isPremium) return;
    this.props.isPremium = true;
    this.addDomainEvent(new UserPremiumUpgradedEvent(this.id));
  }

  public updateProfile(name: string, email?: string, avatar?: string): void {
    if (!name || name.trim() === "") {
      throw new ValidationError("Tên không được bỏ trống.");
    }
    this.props.name = name.trim();
    if (email !== undefined) {
      this.props.email = email.toLowerCase().trim();
    }
    if (avatar !== undefined) {
      this.props.avatar = avatar;
    }
  }

  public updateVerification(isVerified: boolean): void {
    this.props.isVerified = isVerified;
  }

  public updateActiveStatus(isActive: boolean): void {
    this.props.isActive = isActive;
  }

  public updatePassword(newHash: string): void {
    this.props.passwordHash = newHash;
  }

  public updateBadges(badges: string[]): void {
    this.props.badges = badges;
  }

  public addFavorite(productId: string): void {
    if (!this.props.favorites.includes(productId)) {
      this.props.favorites.push(productId);
    }
  }

  public removeFavorite(productId: string): void {
    this.props.favorites = this.props.favorites.filter((id) => id !== productId);
  }

  public follow(sellerId: string): void {
    if (!this.props.following.includes(sellerId)) {
      this.props.following.push(sellerId);
    }
  }

  public unfollow(sellerId: string): void {
    this.props.following = this.props.following.filter((id) => id !== sellerId);
  }

  public toProps(): Required<UserProps> & { id: string } {
    return {
      id: this.id,
      name: this.props.name,
      email: this.props.email,
      passwordHash: this.props.passwordHash,
      role: this.props.role,
      isActive: this.props.isActive,
      isVerified: this.props.isVerified,
      isPremium: this.props.isPremium,
      avatar: this.props.avatar,
      badges: this.props.badges,
      favorites: this.props.favorites,
      following: this.props.following,
    };
  }

  // Getters
  get name() { return this.props.name; }
  get email() { return this.props.email; }
  get passwordHash() { return this.props.passwordHash; }
  get role() { return this.props.role; }
  get isActive() { return this.props.isActive; }
  get isVerified() { return this.props.isVerified; }
  get isPremium() { return this.props.isPremium; }
  get avatar() { return this.props.avatar; }
  get badges() { return this.props.badges; }
  get favorites() { return this.props.favorites; }
  get following() { return this.props.following; }
}
